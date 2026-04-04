// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: 
        | `/`
        | `/(app)`
        | `/(app)/auth`
        | `/(app)/auth/login`
        | `/(app)/auth/login/password`
        | `/(app)/home`
        | `/(app)/home/`
        | `/(app)/home/(tabs)`
        | `/(app)/home/(tabs)/about`
        | `/(app)/home/(tabs)/about/`
        | `/(app)/home/(tabs)/events`
        | `/(app)/home/(tabs)/events/`
        | `/(app)/home/(tabs)/feed`
        | `/(app)/home/(tabs)/feed/`
        | `/(app)/home/(tabs)/sermons`
        | `/(app)/home/(tabs)/sermons/`
        | `/(app)/home/about`
        | `/(app)/home/about/`
        | `/(app)/home/events`
        | `/(app)/home/events/`
        | `/(app)/home/feed`
        | `/(app)/home/feed/`
        | `/(app)/home/sermons`
        | `/(app)/home/sermons/`
        | `/(app)/home/settings`
        | `/(app)/home/settings/`
        | `/(app)/home/settings/blocked-users`
        | `/(app)/home/settings/edit-profile`
        | `/_sitemap`
        | `/auth`
        | `/auth/login`
        | `/auth/login/password`
        | `/home`
        | `/home/`
        | `/home/(tabs)`
        | `/home/(tabs)/about`
        | `/home/(tabs)/about/`
        | `/home/(tabs)/events`
        | `/home/(tabs)/events/`
        | `/home/(tabs)/feed`
        | `/home/(tabs)/feed/`
        | `/home/(tabs)/sermons`
        | `/home/(tabs)/sermons/`
        | `/home/about`
        | `/home/about/`
        | `/home/events`
        | `/home/events/`
        | `/home/feed`
        | `/home/feed/`
        | `/home/sermons`
        | `/home/sermons/`
        | `/home/settings`
        | `/home/settings/`
        | `/home/settings/blocked-users`
        | `/home/settings/edit-profile`
      DynamicRoutes: 
        | `/(app)/auth/signup/${OneRouter.SingleRoutePart<T>}`
        | `/auth/signup/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate: 
        | `/(app)/auth/signup/[method]`
        | `/auth/signup/[method]`
      IsTyped: true
      RouteTypes: {
        '/(app)/auth/signup/[method]': RouteInfo<{ method: string }>
        '/auth/signup/[method]': RouteInfo<{ method: string }>
      }
    }
  }
}

/**
 * Helper type for route information
 */
type RouteInfo<Params = Record<string, never>> = {
  Params: Params
  LoaderProps: { path: string; search?: string; subdomain?: string; params: Params; request?: Request }
}