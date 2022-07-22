
export const log = window.console.log

export function wait(ms: number): Promise<void> {
    return new Promise<void>((res, rej) => {
        setTimeout(() => res(), ms)
    })
}
