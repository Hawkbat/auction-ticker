import { wait } from "./general"

const SHEET_URL = 'https://auction-ticker.hawkbar.workers.dev/'

function sheetToJsValue(c: string): any {
    if (['true', 't', 'yes', 'y'].includes(c.toLowerCase())) return true
    else if (['false', 'f', 'no', 'n'].includes(c.toLowerCase())) return false
    else if (!Number.isNaN(parseFloat(c))) return parseFloat(c)
    return c
}

function headerToJs(h: string): string {
    return h.replaceAll(/^[A-Z]+/g, s => s.toLowerCase()).replaceAll(/\s+/g, '')
}

async function doJsonFetchWithRetry(url: string, method: string, body?: string) {
    let backoff = 1000
    const maxBackoff = 64 * 1000
    const start = Date.now()
    const deadline = start + 60 * 10 * 1000

    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { method, body })
            if (res.ok) {
                return await res.json()
            } else {
                const errorText = `${res.status}: ${res.statusText}\n${await res.text()}`
                if (res.status === 408 || res.status === 429 || res.status >= 500) {
                    console.error(res)
                    await wait(backoff + Math.random() * 1000)
                    backoff = Math.min(backoff * 2, maxBackoff)
                } else {
                    console.error(res)
                    alert('An unexpected error occurred.')
                    throw new Error(errorText)
                }
            }
        } catch (e) {
            console.error(e)
            await wait(backoff + Math.random() * 1000)
            backoff = Math.min(backoff * 2, maxBackoff)
        }
    }
    alert('An unexpected error occurred.')
    console.log('The request timed out after', (Date.now() - start) / 1000, 'seconds')
    throw new Error('The request timed out.')
}

async function fetchData() {
    const json: SheetResponse = await doJsonFetchWithRetry(SHEET_URL, 'GET')
    const headers = json.values[0]
    const values = json.values.slice(1).map(a => a.reduce((p, c, i) => {
        return { ...p, [headerToJs(headers[i])]: sheetToJsValue(c) }
    }, {} as Record<string, any>))
    return values as any
}

export async function getData<T>(): Promise<T[]> {
    const promise = fetchData()
    return await promise
}

interface SheetResponse {
    majorDimension: 'ROWS'
    range: `${string}!A1:Z1000`
    values: string[][]
}
