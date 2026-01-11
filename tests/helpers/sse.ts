import type { Page } from "@playwright/test";

/**
 * Parses SSE event stream text into individual events
 *
 * @param text - Raw SSE stream text containing event and data fields
 * @returns Array of parsed events with event type and data
 *
 * @example
 * const text = "event: message\ndata: hello\n\n";
 * const events = parseSSEStream(text);
 * // Returns: [{ event: "message", data: "hello" }]
 */
export function parseSSEStream(text: string): Array<{
  event: string;
  data: string;
}> {
  const events: Array<{ event: string; data: string }> = [];
  const lines = text.split("\n");
  let currentEvent: { event?: string; data?: string } = {};

  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      currentEvent.data = line.slice(5).trim();
    } else if (line === "" && currentEvent.event && currentEvent.data) {
      events.push({
        event: currentEvent.event,
        data: currentEvent.data,
      });
      currentEvent = {};
    }
  }

  return events;
}

/**
 * Waits for an SSE event to be received on the page
 *
 * Uses the EventSource API in the browser context to listen for SSE events.
 * Useful for testing Datastar SSE endpoints that send reactive UI updates.
 *
 * @param page - Playwright page instance
 * @param url - SSE endpoint URL (relative or absolute)
 * @param eventType - Event type to wait for (e.g., 'datastar-patch-signals')
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with the parsed event data
 * @throws Error if timeout is reached or EventSource encounters an error
 *
 * @example
 * const data = await waitForSSEEvent(
 *   page,
 *   "/api/updates",
 *   "datastar-patch-signals",
 *   3000
 * );
 */
export async function waitForSSEEvent(
  page: Page,
  url: string,
  eventType: string = "datastar-patch-signals",
  timeout: number = 5000,
): Promise<string> {
  return await page.evaluate(
    async ({ url, eventType, timeout }) => {
      return new Promise<string>((resolve, reject) => {
        const eventSource = new EventSource(url);
        const timeoutId = setTimeout(() => {
          eventSource.close();
          reject(new Error(`Timeout waiting for SSE event: ${eventType}`));
        }, timeout);

        eventSource.addEventListener(eventType, (event: Event) => {
          clearTimeout(timeoutId);
          eventSource.close();
          const messageEvent = event as MessageEvent;
          resolve(messageEvent.data);
        });

        eventSource.onerror = () => {
          clearTimeout(timeoutId);
          eventSource.close();
          reject(new Error("EventSource error occurred"));
        };
      });
    },
    { url, eventType, timeout },
  );
}

/**
 * Captures all SSE events from a stream for a specified duration
 *
 * Opens an EventSource connection and collects all message events
 * for the specified duration before closing the connection.
 *
 * @param page - Playwright page instance
 * @param url - SSE endpoint URL (relative or absolute)
 * @param duration - How long to capture events in milliseconds (default: 2000)
 * @returns Promise that resolves with an array of captured event data strings
 *
 * @example
 * const events = await captureSSEEvents(page, "/api/stream", 3000);
 * console.log(`Captured ${events.length} events`);
 */
export async function captureSSEEvents(
  page: Page,
  url: string,
  duration: number = 2000,
): Promise<string[]> {
  return await page.evaluate(
    async ({ url, duration }) => {
      return new Promise<string[]>((resolve) => {
        const events: string[] = [];
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event: MessageEvent) => {
          events.push(event.data);
        };

        setTimeout(() => {
          eventSource.close();
          resolve(events);
        }, duration);
      });
    },
    { url, duration },
  );
}
