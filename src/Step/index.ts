export interface Step {
  id: string;
  executeFn: (previousStepResult?: any) => any;
  rollbackFn: (currentStepResult: any) => any;
}

export interface ExecutionStep extends Step {
  index: number;
  result?: any;
}

export interface StepResult {
  step: ExecutionStep;
  result: any;
}
