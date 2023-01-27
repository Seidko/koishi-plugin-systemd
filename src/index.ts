import { Context, h, Schema } from 'koishi'
import { spawn } from 'child_process'

export const name = 'systemd'

export interface Config {
  authority: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    authority: Schema.number().default(4).description('查询日志所需的权限等级，**注意：将此等级调整过低（如1）会导致你的系统日志可以被任何人查询！**')
  }).description('journalctl 日志查询设置')
])

export function apply(ctx: Context, config: Config) {
  ctx.command('journalctl', { authority: config.authority })
  .option('follow', '-f')
  .option('unit', '-u <unit:string>')
  .action(({ options, session }) => {
    const { follow, unit } = options
    const command = `journalctl ${ follow ? '-f': ''} -u "${unit}"`
    const journalProcess = spawn(command)
    journalProcess.stdout.on('data', (data) => {
      session.send(h.text(data))
    })
    journalProcess.on('close', (code) => {
      if (code !== 0) session.send(h.text(`journal 异常退出，错误码 ${code}`))
      session.send(h.text('日志结束'))
    })
  })
}
