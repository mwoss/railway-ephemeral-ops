export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateDockerImage(image: string): ValidationResult {
  if (!image || image.trim() === '') {
    return {
      isValid: false,
      error: 'Docker image is required',
    };
  }

  // Check if image has a tag (contains ':')
  if (!image.includes(':')) {
    return {
      isValid: false,
      error: `Docker images require a tag (e.g., '${image}:latest' or '${image}:18')`,
    };
  }

  // Basic format validation: name:tag
  const parts = image.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      isValid: false,
      error: 'Invalid Docker image format. Expected format: name:tag',
    };
  }

  return { isValid: true };
}

export function validateCommand(command: string): ValidationResult {
  if (!command || command.trim() === '') {
    return {
      isValid: false,
      error: 'Command is required',
    };
  }

  return { isValid: true };
}

export function validateTTL(ttl: number | null): ValidationResult {
  if (ttl === null) {
    return { isValid: true };
  }

  if (ttl <= 0) {
    return {
      isValid: false,
      error: 'TTL must be greater than 0',
    };
  }

  if (ttl > 1440) { // 24 hours
    return {
      isValid: false,
      error: 'TTL cannot exceed 24 hours (1440 minutes)',
    };
  }

  return { isValid: true };
}

export function validateMissionInputs(
  image: string,
  command: string,
  ttl: number | null
): ValidationResult {
  const imageValidation = validateDockerImage(image);
  if (!imageValidation.isValid) {
    return imageValidation;
  }

  const commandValidation = validateCommand(command);
  if (!commandValidation.isValid) {
    return commandValidation;
  }

  const ttlValidation = validateTTL(ttl);
  if (!ttlValidation.isValid) {
    return ttlValidation;
  }

  return { isValid: true };
}
