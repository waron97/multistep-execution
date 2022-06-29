import EventEmitter from "eventemitter3";

import { MultistepExecutionParams } from "../Params";
import { ExecutionStep, Step } from "../Step";

class MultistepExecution {
  private steps: ExecutionStep[];
  private params: MultistepExecutionParams;
  private emitter: EventEmitter<"success" | "end" | "error" | "rollback">;

  constructor(steps: Step[], params: MultistepExecutionParams) {
    this.emitter = new EventEmitter();

    this.steps = steps.map((s, index) => ({ ...s, index }));
    this.params = params;

    this.startExecutionChain();
  }

  private async startExecutionChain() {
    for (const step of this.steps) {
      let prevResult;
      try {
        const result: any = await step.executeFn(prevResult);
        this.steps[step.index].result = result;
        prevResult = result;
        this.emitter.emit("success", result, step);
      } catch (e) {
        this.emitter.emit("error", e, step);
        this.startRollbackChain(step.index - 1);
        break;
      }
    }

    this.emitter.emit("end");
  }

  private async startRollbackChain(index: number) {
    for (let i = index; i <= 0; i--) {
      const step = this.steps[i];
      let result;

      try {
        result = await step.rollbackFn(step.result);
      } catch (e) {
        result = e;
      }

      this.emitter.emit("rollback", result, step);
    }
  }

  onSuccess(fn: (result: any, step: ExecutionStep) => void) {
    this.emitter.on("success", fn);
  }

  onEnd(fn: () => void) {
    this.emitter.on("end", fn);
  }

  onError(fn: (error: any, step: ExecutionStep) => void) {
    this.emitter.on("error", fn);
  }

  onRollback(fn: (result: any, step: ExecutionStep) => void) {
    this.emitter.on("rollback", fn);
  }
}

export default MultistepExecution;
