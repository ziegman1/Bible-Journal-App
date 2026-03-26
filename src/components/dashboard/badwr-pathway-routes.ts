/** Central route map for BADWR pathway — shared by vector map and any future tools. */
export const BADWR_PATHWAY_ROUTES = {
  soap: "/app/read",
  pray: "/app/read",
  share: "/app/groups",
  chat: "/app/threads",
  family: "/app/groups",
  watch: "/app/insights",
  modelAssist: "/app/groups",
  transformed: "/app/insights",
  new33: "/app/groups/new",
  badwr: "/app",
  me: "/app",
  miniSoap: "/app/read",
  miniPray: "/app/read",
  miniChat: "/app/threads",
  miniShare: "/app/groups",
} as const;

export type BadwrPathwayRouteKey = keyof typeof BADWR_PATHWAY_ROUTES;
