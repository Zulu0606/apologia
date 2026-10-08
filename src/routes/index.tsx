import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { AskScripture } from "@/components/ask-scripture";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    embed: search.embed === "1" || search.embed === "true" || search.embed === true,
  }),
  search: {
    middlewares: [stripSearchParams({ embed: false })],
  },
  component: Home,
});

function Home() {
  const { embed } = Route.useSearch();
  return <AskScripture embed={embed} />;
}
