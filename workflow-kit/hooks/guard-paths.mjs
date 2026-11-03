import { checkPath, isAgentMode, loadAllowedPaths, loadProtectedPaths, runHook } from './guard-lib.mjs'

await runHook((input) => {
  const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path
  if (!filePath) return null
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()
  return checkPath(input.tool_name, filePath, {
    projectDir,
    protectedPaths: loadProtectedPaths(projectDir),
    allowedPaths: loadAllowedPaths(),
    agentMode: isAgentMode(),
  })
})
