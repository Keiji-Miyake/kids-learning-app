import { describe, it, expect } from 'vitest';
import { calculateExamResult } from '../components/ExamScreen';

describe('Exam Result Evaluator', () => {
  it('should evaluate rank S for 90% or higher', () => {
    const res = calculateExamResult(10, 10);
    expect(res.rank).toBe('S');
    expect(res.passed).toBe(true);
  });

  it('should evaluate rank A for 70% - 89%', () => {
    const res = calculateExamResult(8, 10);
    expect(res.rank).toBe('A');
    expect(res.passed).toBe(true);
  });

  it('should evaluate rank B for 50% - 69%', () => {
    const res = calculateExamResult(6, 10);
    expect(res.rank).toBe('B');
    expect(res.passed).toBe(false);
  });

  it('should evaluate rank C for below 50%', () => {
    const res = calculateExamResult(3, 10);
    expect(res.rank).toBe('C');
    expect(res.passed).toBe(false);
  });
});
