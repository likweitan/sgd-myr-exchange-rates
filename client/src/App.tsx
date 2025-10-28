import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Rate = {
  id: number;
  platform: string;
  base_currency: string;
  target_currency: string;
  exchange_rate: number;
  created_at?: string;
  retrieved_at?: string;
};

type RatesResponse = {
  data: Rate[];
};

function App() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://sgd-myr-exchange-rates.vercel.app/api/v1/rates/latest",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload: RatesResponse = await response.json();

        setRates(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }

        console.error("Failed to fetch exchange rates", err);
        setError("Unable to load exchange rates right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchRates();

    return () => controller.abort();
  }, []);

  const lastUpdated = useMemo(() => {
    if (rates.length === 0) {
      return null;
    }

    const date = rates[0]?.created_at;
    if (!date) {
      return null;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [rates]);

  const sortedRates = useMemo(
    () => [...rates].sort((a, b) => a.platform.localeCompare(b.platform)),
    [rates]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <a
            href="#rates"
            className="text-lg font-semibold tracking-tight transition"
          >
            SGD → MYR
          </a>
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#rates"
                  className={navigationMenuTriggerStyle()}
                >
                  Rates
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="https://sgd-myr-exchange-rates.vercel.app/api/v1/rates/latest"
                  target="_blank"
                  rel="noreferrer"
                  className={navigationMenuTriggerStyle()}
                >
                  API
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>
      <main className="flex flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 py-2">
          <section id="rates" className="w-full space-y-6 text-center">
            <div className="space-y-2">
              <Badge variant="outline">SGD → MYR</Badge>
              <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
                Exchange Rates
              </h1>
              <p className="text-base text-slate-400 sm:text-lg">
                Rates across popular remittance platforms.
              </p>
              {lastUpdated && (
                <p className="text-sm text-slate-500">Updated {lastUpdated}</p>
              )}
            </div>

            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="" aria-hidden>
                    <CardHeader>
                      <Skeleton className="h-3 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="mx-auto h-16 w-40" />
                      <Skeleton className="mx-auto h-4 w-52" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && !loading && (
              <Card className="mx-auto max-w-md border-red-500/50 bg-red-500/10 text-red-100">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="text-red-200">
                    {error}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {!loading && !error && rates.length === 0 && (
              <div className="flex flex-col items-center gap-4">
                <Button disabled size="sm">
                  <Spinner />
                  Loading...
                </Button>
              </div>
            )}

            {!loading && !error && sortedRates.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedRates.map((rate) => (
                  <Card key={rate.id} className="hover:shadow-xl gap-1">
                    <CardHeader>
                      <CardTitle>{rate.platform}</CardTitle>
                      {/* <CardDescription className="text-slate-500">
                        {rate.base_currency} to {rate.target_currency}
                      </CardDescription> */}
                    </CardHeader>
                    <CardContent className="space-y-1 text-left">
                      <p className="text-3xl font-semibold tracking-tight sm:text-3xl">
                        {rate.exchange_rate.toFixed(4)}
                      </p>
                      <p className="text-sm text-slate-400">
                        1 {rate.base_currency} = {rate.exchange_rate.toFixed(4)}{" "}
                        {rate.target_currency}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
