export default class InputVerificationResult {
    constructor(public verified: boolean = false,
        public message: string | undefined = undefined) {}
}