/// <reference types="react-scripts" />

declare module "*.wav" {
    declare const url: string
    export default url
}