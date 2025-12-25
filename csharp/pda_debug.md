
## PDA 本地调试

前端修改地址



1. 启动箭头
2. PDA调试属性-创建虚拟目录
3. 启动
4. 任务栏 IIS-EXPRESS
   1. 右键显示左右程序
   2. 点击某行，然后点击配置
   3. 在配置文件中进行配置

``` yaml
<site name="PDAServer" id="2">
    <application path="/" applicationPool="Clr4IntegratedAppPool">
        <virtualDirectory path="/" physicalPath="{项目地址}\pdaserver" />
    </application>
    <bindings>
        <binding protocol="http" bindingInformation="*:44345:localhost" />
        <binding protocol="https" bindingInformation="*:44345:localhost" />
        <binding protocol="http" bindingInformation="*:44345:{电脑IP}" />
    </bindings>
</site>
```

5. powershell管理员模式启动：开放端口

``` cmd
netsh http add urlacl url=http://localhost:44345/ user=Everyone
netsh http add urlacl url=http://{电脑IP}:44345/ user=Everyone
```

6. 重启项目