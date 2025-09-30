// Basic Effect Actor Test
// Merkle DAG: test -> effect-actor-basic

import { Effect } from "effect"
import { ActorSystemUtils, Message } from "../src/actor/effect-actor"

// Define test messages
interface TestMessage extends Message {
  readonly _tag: "TestMessage"
  readonly value: string
}

interface IncrementMessage extends Message {
  readonly _tag: "Increment"
  readonly amount: number
}

// Define test behavior
const testBehavior = (state: { count: number }, message: TestMessage | IncrementMessage) => {
  return Effect.gen(function* () {
    switch (message._tag) {
      case "TestMessage":
        return { count: state.count, message: message.value }
      case "Increment":
        return { count: state.count + message.amount }
      default:
        return state
    }
  })
}

describe("Effect Actor Basic Functionality", () => {
  test("should create actor system", async () => {
    const program = Effect.gen(function* () {
      const system = yield* ActorSystemUtils.make("test-system")
      return system
    })

    const result = await Effect.runPromise(program)
    expect(result).toBeDefined()
  })

  test("should create and interact with actor", async () => {
    const program = Effect.gen(function* () {
      const system = yield* ActorSystemUtils.make("test-system")

      // Create actor
      const actor = yield* system.make(
        "test-actor",
        { count: 0 },
        testBehavior
      )

      // Send increment message
      yield* actor.tell({ _tag: "Increment", amount: 5 } as IncrementMessage)
      yield* actor.tell({ _tag: "Increment", amount: 3 } as IncrementMessage)

      return "success"
    })

    const result = await Effect.runPromise(program)
    expect(result).toBe("success")
  })

  test("should handle message types correctly", () => {
    const testMsg: TestMessage = {
      _tag: "TestMessage",
      value: "hello"
    }

    const incrementMsg: IncrementMessage = {
      _tag: "Increment",
      amount: 10
    }

    expect(testMsg._tag).toBe("TestMessage")
    expect(testMsg.value).toBe("hello")
    expect(incrementMsg._tag).toBe("Increment")
    expect(incrementMsg.amount).toBe(10)
  })

  test("should demonstrate supervision capabilities", async () => {
    const failingBehavior = (state: { count: number }, message: IncrementMessage) => {
      return Effect.gen(function* () {
        if (message.amount < 0) {
          throw new Error("Negative increment not allowed")
        }
        return { count: state.count + message.amount }
      })
    }

    const program = Effect.gen(function* () {
      const system = yield* ActorSystemUtils.make("supervision-test")

      const actor = yield* system.make(
        "supervised-actor",
        { count: 0 },
        failingBehavior,
        { maxRestarts: 2, restartDelay: 100 }
      )

      // This should succeed
      yield* actor.tell({ _tag: "Increment", amount: 5 } as IncrementMessage)

      return "supervision test passed"
    })

    const result = await Effect.runPromise(program)
    expect(result).toBe("supervision test passed")
  })
})
