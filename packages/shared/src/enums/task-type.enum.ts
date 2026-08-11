/**
 * Task and submission types.
 * Submission type must match task type.
 * @see docs/DOMAIN_MODEL.md §8, §9
 */
export enum TaskType {
  QUIZ = 'QUIZ',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  GROUP = 'GROUP',
  TIMED = 'TIMED',
}
