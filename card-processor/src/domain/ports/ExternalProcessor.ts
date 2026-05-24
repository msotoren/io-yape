export interface ExternalProcessor {
  process(forceError: boolean): Promise<void>;
}

