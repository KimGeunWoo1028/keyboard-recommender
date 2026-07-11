/** True when the Next app was built with internal ``/debug`` routes enabled. */
export function isInternalDebugUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INTERNAL_DEBUG === "1";
}
