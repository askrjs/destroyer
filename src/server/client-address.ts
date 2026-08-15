import { CLIENT_ADDRESS_HEADER } from "@askrjs/node";

/** Returns the Node-adapter-authenticated TCP peer used by IP-keyed security controls. */
export function clientAddress(headers: Headers): string {
  return headers.get(CLIENT_ADDRESS_HEADER) ?? "unknown";
}
