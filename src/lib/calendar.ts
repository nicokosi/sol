import {CONSTANTS} from './constants'

export const MEETING_PROVIDERS_URLS = [
  'https://us01web.zoom.us',
  'https://us02web.zoom.us',
  'https://us03web.zoom.us',
  'https://us04web.zoom.us',
  'https://us05web.zoom.us',
  'https://us06web.zoom.us',
  'https://meet.google.com',
  'https://meet.ffmuc.net',
  'https://meet.jit.si',
  'https://teams.microsoft.com',
]

export function extractMeetingLink(
  text?: string,
  location?: string,
): string | null {
  let link: string | null = null
  if (location) {
    const isLocationUrl = CONSTANTS.REGEX_VALID_URL.test(location)
    if (isLocationUrl) {
      link = location!
    }
  }

  if (!link && !!text) {
    link =
      text
        .replace(/\n/g, ' ')
        .replace('<', ' ')
        .replace('>', ' ')
        .split(' ')
        .filter(token => CONSTANTS.REGEX_VALID_URL.test(token))
        .find(link =>
          MEETING_PROVIDERS_URLS.some(baseUrl => link.includes(baseUrl)),
        ) ?? null
  }

  return link
}
