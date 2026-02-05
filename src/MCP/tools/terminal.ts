
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

export const RunCommandSchema = z.object({
  command: z.string().describe("The command to execute."),
  cwd: z.string().optional().describe("The working directory to execute the command in."),
});

export class TerminalTools {
  static async runCommand(args: z.infer<typeof RunCommandSchema>) {
    try {
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: args.cwd || process.cwd(),
      });
      
      let output = "";
      if (stdout) output += `STDOUT:\n${stdout}\n`;
      if (stderr) output += `STDERR:\n${stderr}\n`;
      
      if (!output) output = "Command executed successfully with no output.";
      
      return output;
    } catch (error: any) {
      return `Error executing command: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`;
    }
  }
}
