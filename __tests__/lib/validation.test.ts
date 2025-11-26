import { describe, it, expect } from '@jest/globals';
import {
  validateDockerImage,
  validateCommand,
  validateTTL,
  validateMissionInputs,
} from '@/lib/validation';

describe('Validation', () => {
  describe('validateDockerImage', () => {
    it('should reject image without tag', () => {
      const result = validateDockerImage('python');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('require a tag');
    });

    it('should accept valid image with tag', () => {
      const result = validateDockerImage('python:3.9-slim');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCommand', () => {
    it('should reject empty command', () => {
      const result = validateCommand('');
      expect(result.isValid).toBe(false);
    });

    it('should accept valid command', () => {
      const result = validateCommand('echo "test"');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateTTL', () => {
    it('should accept null TTL (manual mode)', () => {
      const result = validateTTL(null);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative TTL', () => {
      const result = validateTTL(-5);
      expect(result.isValid).toBe(false);
    });

    it('should reject TTL exceeding 24 hours', () => {
      const result = validateTTL(1441);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateMissionInputs', () => {
    it('should validate all inputs together', () => {
      const result = validateMissionInputs('python:3.9-slim', 'echo "test"', 15);
      expect(result.isValid).toBe(true);
    });

    it('should fail on invalid inputs', () => {
      expect(validateMissionInputs('python', 'echo "test"', 15).isValid).toBe(false);
      expect(validateMissionInputs('python:3.9', '', 15).isValid).toBe(false);
      expect(validateMissionInputs('python:3.9', 'echo test', -1).isValid).toBe(false);
    });
  });
});
