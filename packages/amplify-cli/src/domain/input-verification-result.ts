export class InputVerificationResult {
  constructor(
    public verified: boolean = false,
    public helpCommandAvailable: boolean = false,
    public message: string | undefined = undefined
  ) {}
}
