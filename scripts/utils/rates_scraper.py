"""Playwright-powered scrapers for collecting exchange rates."""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

CIMB_URL = "https://www.cimbclicks.com.sg/sgd-to-myr"
WISE_URL = "https://wise.com/gb/currency-converter/sgd-to-myr-rate"
WESTERNUNION_URL = (
    "https://www.westernunion.com/sg/en/currency-converter/sgd-to-myr-rate.html"
)


def _new_context(browser: Browser) -> BrowserContext:
    return browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1920, "height": 1080},
        locale="en-US",
        timezone_id="Asia/Singapore",
        extra_http_headers={
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
        },
    )


def _launch_browser():
    playwright = sync_playwright().start()
    is_ci = (
        os.getenv("CI") == "true"
        or os.getenv("GITHUB_ACTIONS") == "true"
        or not os.getenv("DISPLAY")
    )
    browser = playwright.chromium.launch(
        headless=is_ci,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--window-size=1920,1080",
        ],
    )
    return playwright, browser


def _extract_rate_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    # Prefer a number that follows a MYR label if present (e.g. "SGD 1.00 = MYR 3.2405").
    myr_match = re.search(r"MYR\s*([\d]+(?:[.,]\d+)?)", text, flags=re.IGNORECASE)
    if (match := myr_match) is not None:
        return match.group(1).replace(",", "")
    # Fall back to the last numeric token in the string.
    matches = re.findall(r"[\d]+(?:[.,]\d+)?", text)
    if matches:
        return matches[-1].replace(",", "")
    return None


def _scrape_cimb(browser: Browser, timestamp: datetime, rates: List[Dict[str, str]]) -> None:
    print("\nAttempting to fetch CIMB rate...")
    context: Optional[BrowserContext] = None
    try:
        context = _new_context(browser)
        page = context.new_page()

        def log_response(response):
            if "cimbrate" in response.url.lower():
                print(f"[CIMB][response] {response.status} {response.url}")

        page.on("response", log_response)

        print("Navigating to CIMB URL...")
        page.goto(CIMB_URL, wait_until="networkidle", timeout=60000)

        try:
            page.wait_for_selector("#rateStr, span.exchAnimate", timeout=30000)
        except PlaywrightTimeoutError:
            print("CIMB rate elements did not appear within 30s; continuing without wait.")

        selectors = [
            "#rateStr",
            "label#rateStr",
            ".rateStr",
            "span.exchAnimate",
            "div.rateStr span",
        ]
        parsed_rate = None
        for selector in selectors:
            element = page.query_selector(selector)
            if not element:
                continue
            text = element.text_content().strip()
            parsed_rate = _extract_rate_text(text)
            if parsed_rate:
                print(f"Found CIMB rate element with selector '{selector}': {text}")
                break

        if parsed_rate:
            print(f"CIMB Exchange Rate: {parsed_rate}")
            rates.append(
                {
                    "exchange_rate": parsed_rate,
                    "retrieved_at": timestamp.isoformat(),
                    "platform": "CIMB",
                    "base_currency": "SGD",
                    "target_currency": "MYR",
                }
            )
        else:
            print("CIMB rate element not found or unparsable!")

    except PlaywrightTimeoutError as error:
        print(f"CIMB scraping timed out: {error}")
    except Exception as error:  # pragma: no cover - defensive path
        print(f"Error fetching CIMB rate: {error}")
    finally:
        if context:
            context.close()


def _scrape_wise(browser: Browser, timestamp: datetime, rates: List[Dict[str, str]]) -> None:
    print("\nAttempting to fetch Wise rate...")
    context: Optional[BrowserContext] = None
    try:
        context = _new_context(browser)
        page = context.new_page()

        print("Navigating to Wise URL...")
        response = page.goto(WISE_URL, wait_until="domcontentloaded", timeout=60000)
        if response:
            print(f"[Wise] Initial response status: {response.status}")

        try:
            page.wait_for_selector("h2.np-text-title-section", timeout=30000)
            print("Wise headline selector appeared.")
        except PlaywrightTimeoutError:
            print("Wise headline selector did not appear within 30s; continuing.")

        page.wait_for_timeout(5000)

        selectors = [
            "span.cc__source-to-target",
            "span[data-qa='exchange-rate']",
            "span[data-qa='target-value']",
            "div[data-qa='target-rate'] span",
            "h2.np-text-title-section",
            "h2[class*='np-text-title']",
        ]

        parsed_rate = None
        for selector in selectors:
            element = page.query_selector(selector)
            if element:
                text = element.text_content().strip()
                parsed_rate = _extract_rate_text(text)
                if parsed_rate:
                    print(f"Found Wise rate element with selector '{selector}': {text}")
                    break

        if not parsed_rate:
            # Fallback: search the entire page content for an SGD-to-MYR pattern.
            print("Wise selectors failed; attempting regex fallback on page content.")
            full_text = page.content()
            if full_text:
                headline_match = re.search(
                    r"1\s*SGD\s*=\s*([\d]+(?:[.,]\d+)?)\s*MYR", full_text, flags=re.IGNORECASE
                )
                if headline_match:
                    parsed_rate = headline_match.group(1).replace(",", "")
                    print("Regex fallback extracted Wise rate from headline markup.")

        if parsed_rate:
            print(f"Wise Exchange Rate: {parsed_rate}")
            rates.append(
                {
                    "exchange_rate": parsed_rate,
                    "retrieved_at": timestamp.isoformat(),
                    "platform": "WISE",
                    "base_currency": "SGD",
                    "target_currency": "MYR",
                }
            )
        else:
            print("Wise rate element not found or unparsable!")

    except PlaywrightTimeoutError as error:
        print(f"Wise scraping timed out: {error}")
    except Exception as error:
        print(f"Error fetching Wise rate: {error}")
    finally:
        if context:
            context.close()


def _scrape_western_union(
    browser: Browser, timestamp: datetime, rates: List[Dict[str, str]]
) -> None:
    print("\nAttempting to fetch Western Union rate...")
    context: Optional[BrowserContext] = None
    page: Optional[Page] = None
    try:
        context = _new_context(browser)
        context.add_cookies(
            [
                {
                    "name": "policy",
                    "value": "true",
                    "domain": ".westernunion.com",
                    "path": "/",
                }
            ]
        )
        page = context.new_page()

        def log_failed_request(request):
            print(
                f"[WesternUnion request failed] {request.method} {request.url} - {request.failure}"
            )

        page.on("request_failed", log_failed_request)

        print("Navigating to Western Union URL...")
        page.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {},
            };
            delete navigator.__proto__.webdriver;
        """
        )

        try:
            response = page.goto(
                WESTERNUNION_URL, timeout=60000, wait_until="domcontentloaded"
            )
        except PlaywrightTimeoutError:
            print(
                "Western Union navigation timed out while waiting for domcontentloaded; continuing."
            )
            response = None

        try:
            page.wait_for_load_state("networkidle", timeout=30000)
            print("Western Union page reached 'networkidle' state.")
        except PlaywrightTimeoutError:
            print("Western Union page did not reach 'networkidle' within 30s; continuing.")

        page.wait_for_timeout(5000)

        selectors = [
            "span.fx-to",
            "[class*='fx-to']",
            "[data-testid*='fx-to']",
            "[class*='currency'] span",
        ]

        parsed_rate = None
        for selector in selectors:
            rate_element = page.query_selector(selector)
            if rate_element:
                text = rate_element.text_content().strip()
                parsed_rate = _extract_rate_text(text)
                if parsed_rate:
                    print(f"Found rate element with selector: {selector}")
                    break

        if parsed_rate:
            print(f"Western Union Exchange Rate: {parsed_rate}")
            rates.append(
                {
                    "exchange_rate": parsed_rate,
                    "retrieved_at": timestamp.isoformat(),
                    "platform": "WESTERNUNION",
                    "base_currency": "SGD",
                    "target_currency": "MYR",
                }
            )
        else:
            print("Western Union rate element not found or unparsable!")

    except PlaywrightTimeoutError as error:
        print(f"Western Union scraping timed out: {error}")
    except Exception as error:
        print(f"Error fetching Western Union rate: {error}")
    finally:
        if page:
            page.close()
        if context:
            context.close()


def collect_rates() -> List[Dict[str, str]]:
    """Collect exchange rates from the supported providers."""
    playwright = None
    browser = None
    try:
        playwright, browser = _launch_browser()
        rates: List[Dict[str, str]] = []
        timestamp = datetime.utcnow() + timedelta(hours=8)

        _scrape_cimb(browser, timestamp, rates)
        _scrape_wise(browser, timestamp, rates)
        _scrape_western_union(browser, timestamp, rates)

        return rates
    finally:
        if browser:
            browser.close()
        if playwright:
            playwright.stop()
