import { ExternalProcessor } from '@/domain/ports/ExternalProcessor';
import { simulateExternalCall } from './ExternalProcessorSimulator';

export class ExternalProcessorClient implements ExternalProcessor {
  async process(forceError: boolean): Promise<void> {
    await simulateExternalCall(forceError);
  }
}

