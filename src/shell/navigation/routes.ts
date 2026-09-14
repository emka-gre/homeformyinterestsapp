/**
 * Every path the shell can navigate to, built from ids rather than written
 * out at call sites (task 5.3).
 *
 * Module paths are generic by construction: `/m/coffee` is produced by
 * passing the id 'coffee' through, never by a branch that knows Coffee
 * exists. If a helper here ever needs a specific module id, the architecture
 * has been violated (design D2).
 */
export const routes = {
  timeline: '/' as const,
  profile: '/profile' as const,
  /** The only screen a signed-out user can reach. */
  signIn: '/sign-in' as const,
  /**
   * Where an emailed sign-in link lands. Also the path passed to the backend
   * as the link's redirect target, so it must stay in step with the file
   * under src/app/ and with the backend's redirect allow-list.
   */
  authCallback: '/auth/callback' as const,
  /** A module's home screen. */
  module: (moduleId: string) => `/m/${moduleId}` as const,
  /** A screen a module declares in `manifest.routes`. */
  moduleRoute: (moduleId: string, path: string) => `/m/${moduleId}/${path}` as const,
  /** The capture form for one of a module's entry types. */
  capture: (moduleId: string, entryTypeId: string) =>
    `/capture/${moduleId}/${entryTypeId}` as const,
};
