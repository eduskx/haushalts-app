import { checkCommand, isAgentMode, runHook } from './guard-lib.mjs'

await runHook((input) => checkCommand(input.tool_input?.command ?? '', { agentMode: isAgentMode() }))
