import { checkCommand, isAgentMode, loadProtectedPaths, runHook } from './guard-lib.mjs'

await runHook((input) => {
  const agentMode = isAgentMode()
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()
  const protectedPaths = agentMode ? loadProtectedPaths(projectDir) : []
  return checkCommand(input.tool_input?.command ?? '', { agentMode, protectedPaths })
})
