export async function simulateExternalCall(forceError: boolean): Promise<void> {
  const delay = 200 + Math.floor(Math.random() * 300);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (forceError || Math.random() < 0.25) {
    throw new Error('ExternalSimulator: random failure');
  }
}

