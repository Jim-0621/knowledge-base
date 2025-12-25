# SpringCloud

## 简介



微服务是一种软件风格架构，它是以专注于单一职责的很多小型项目为基础，组合成复杂的大型应用。



课程介绍：

1. MybatisPlus + Docker
2. 服务拆分 + 服务治理 + 远程调用
3. 请求路由 + 身份认证 + 配置管理
4. 服务保护 + 分布式事务
5. 异步通信 + 消息可靠性 + 延迟消息
6. 分布式搜索 + 倒排索引 + 数据聚合



## MybatisPlus





### 快速入门



快速开始：

1. 引入依赖 mybatis-plus-boot-starter（这个 starter 已经包含了 mybatis 的 starter ）
2. 自定义的 Mapper 继承 BaseMapper，BaseMapper 是 MP 提供的基础接口，实现了单表的 CRUD

``` java
// 继承 BaseMapper，User 是数据库对应的 PO
public interface UserMapper extends BaseMapper<User> {
}
```



常用注解：

- `@TableName`：表名注解
- `@TableId`：主键注解
- `@TableField`：普通字段注解



### 核心功能



条件构造器 Wrapper：

- QueryWrapper：无论是修改、删除、查询，都可以使用 QueryWrapper 来构建查询条件。
- UpdateWrapper：基于 BaseMapper 的 update 只能直接赋值，使用 UpdateMapper 可以基于现有值
- LambdaQueryWrapper：解决硬编码问题，`username` 替换成 `User::getUsername`

``` java
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.lambda()
        .select(User::getId, User::getUsername, User::getInfo, User::getBalance)
        .like(User::getUsername, "o")
        .ge(User::getBalance, 1000);
List<User> users = userMapper.selectList(wrapper);
users.forEach(System.out::println);
```



自定义 SQL：

避免在业务层编写 SQL，转到持久层。

``` java
// Controller
@Test
void testCustomWrapper() {
    // 1.准备自定义查询条件
    List<Long> ids = List.of(1L, 2L, 4L);
    QueryWrapper<User> wrapper = new QueryWrapper<User>().in("id", ids);

    // 2.调用mapper的自定义方法，直接传递Wrapper
    userMapper.deductBalanceByIds(200, wrapper);
}

// 持久层
// SQL 语句可以用注解，也可以写到 XML 文件中
public interface UserMapper extends BaseMapper<User> {
    @Select("UPDATE user SET balance = balance - #{money} ${ew.customSqlSegment}")
    void deductBalanceByIds(@Param("money") int money, @Param("ew") QueryWrapper<User> wrapper);
}
```



MybatisPlus不仅提供了BaseMapper，还提供了通用的 **Service接口** 及默认实现，封装了一些常用的service模板方法。

基本用法：

1. 定义`IUserService`，继承`IService`
2. 编写`UserServiceImpl`类，继承`ServiceImpl`，实现`UserService`

``` java
public interface IUserService extends IService<User> {
    // 拓展自定义方法
}
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> {
    // 拓展自定义方法
}
```



示例：

``` java
// Controller
@PutMapping("{id}/deduction/{money}")
@ApiOperation("扣减用户余额")
public void deductBalance(@PathVariable("id") Long id, @PathVariable("money")Integer money){
    userService.deductBalance(id, money);
}

// Service
public interface IUserService extends IService<User> {
    void deductBalance(Long id, Integer money);
}

// Impl
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {
    @Override
    public void deductBalance(Long id, Integer money) {
        User user = getById(id);
        if (user == null || user.getStatus() == 2) {
            throw new RuntimeException("用户状态异常");
        }
        if (user.getBalance() < money) {
            throw new RuntimeException("用户余额不足");
        }
        baseMapper.deductMoneyById(id, money);
    }
}

// Mapper
@Update("UPDATE user SET balance = balance - #{money} WHERE id = #{id}")
void deductMoneyById(@Param("id") Long id, @Param("money") Integer money);
```



IService 中还提供了 Lambda 功能来简化我们的复杂查询及更新功能。

``` java
// 普通写法
LambdaQueryWrapper<User> wrapper = new QueryWrapper<User>().lambda()
            .like(username != null, User::getUsername, username)
            .eq(status != null, User::getStatus, status)
            .ge(minBalance != null, User::getBalance, minBalance)
            .le(maxBalance != null, User::getBalance, maxBalance);
List<User> users = userService.list(wrapper);

// lambdaQuery
List<User> users = userService.lambdaQuery()
            .like(username != null, User::getUsername, username)
            .eq(status != null, User::getStatus, status)
            .ge(minBalance != null, User::getBalance, minBalance)
            .le(maxBalance != null, User::getBalance, maxBalance)
            .list();
```

在链式编程的最后有一个`list()`，这是在告诉MP我们的调用结果需要是一个list集合。

另外还有 `.one()`, `.count()` 



批处理

``` java
@Test
void testSaveBatch() {
    // 准备10万条数据
    List<User> list = new ArrayList<>(1000);
    long b = System.currentTimeMillis();
    for (int i = 1; i <= 100000; i++) {
        list.add(buildUser(i));
        // 每1000条批量插入一次
        if (i % 1000 == 0) {
            userService.saveBatch(list);
            list.clear();
        }
    }
    long e = System.currentTimeMillis();
    System.out.println("耗时：" + (e - b));
}
```

相比于逐条新增性能有所提升，但其实它是基于`PrepareStatement`的预编译模式，然后批量提交，最终在数据库执行时还是会有多条insert语句，逐条插入数据。

而如果想要得到最佳性能，最好是将多条SQL合并为一条。

需要在 application.yml 的 jdbc 的 url 中添加参数`&rewriteBatchedStatements=true`



### 扩展功能



- 代码生成：推荐使用插件 MybatisPlus
- 静态工具：有的时候Service之间也会相互调用，为了避免出现循环依赖问题，MybatisPlus提供一个静态工具类：`Db`，其中的一些静态方法与`IService`中方法签名基本一致，也可以帮助我们实现CRUD功能。
- 逻辑删除：在 application.yml 中添加逻辑删除字段即可
- 通用枚举：把枚举类型与数据库类型自动转换。（status 字段，数据库里面是Integer，想要展示 String）
- JSON 类型处理器：处理JSON就可以使用`JacksonTypeHandler`处理器（info 字段，数据库里面是 JSON，获取的是 String，不方便读取）



### 插件功能



- 分页插件：配置类中添加分页插件
- 通用分页实体
  - `UserQuery`：分页查询条件的实体，包含分页、排序参数、过滤条件
  - `PageDTO`：分页结果实体，包含总条数、总页数、当前页数据
  - `UserVO`：用户页面视图实体



## Docker



### 快速入门



微服务项目动辄就是几十台、上百台服务需要部署，有些大型项目甚至达到数万台服务。而**由于每台服务器的运行环境不同，你写好的安装流程、部署脚本并不一定在每个服务器都能正常运行**，经常会出错。这就给系统的部署运维带来了很多困难。

Docker 技术用来帮助项目部署，大大减少了运维工作量。

Docker 安装软件的过程，就是自动搜索下载镜像，然后创建并运行容器的过程。



``` bash
# 安装 MySQL
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ROOT_PASSWORD=123 \
  mysql
```

- `docker run -d` ：创建并运行一个容器，`-d`则是让容器以后台进程运行
- `--name mysql ` : 给容器起个名字叫`mysql`，你可以叫别的
- `-p 3306:3306` : 设置端口映射。
  - **容器是隔离环境**，外界不可访问。但是可以将宿主机端口映射容器内的端口，当访问宿主机指定端口时，就是在访问容器内的端口了。
  - 容器内端口往往是由容器内的进程决定，例如MySQL进程默认端口是3306，因此容器内端口一定是3306；而宿主机端口则可以任意指定，一般与容器内保持一致。
  - 格式： `-p 宿主机端口:容器内端口`，示例中就是将宿主机的3306映射到容器内的3306端口
- `-e TZ=Asia/Shanghai` : 配置容器内进程运行时的一些参数
  - 格式：`-e KEY=VALUE`，KEY和VALUE都由容器内进程决定
  - 案例中，`TZ=Asia/Shanghai`是设置时区；`MYSQL_ROOT_PASSWORD=123`是设置MySQL默认密码
- `mysql` : 设置**镜像**名称，Docker会根据这个名字搜索并下载镜像
  - 格式：`REPOSITORY:TAG`，例如`mysql:8.0`，其中`REPOSITORY`可以理解为镜像名，`TAG`是版本号
  - 在未指定`TAG`的情况下，默认是最新版本，也就是`mysql:latest`



### Docker 基础



####  常见命令

常见命令演示：

``` bash
# 第1步，去DockerHub查看nginx镜像仓库及相关信息

# 第2步，拉取Nginx镜像
docker pull nginx

# 第3步，查看镜像
docker images
# 结果如下：
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
nginx        latest    605c77e624dd   16 months ago   141MB
mysql        latest    3218b38490ce   17 months ago   516MB

# 第4步，创建并运行Nginx容器
docker run -d --name nginx -p 80:80 nginx

# 第5步，查看运行中容器
docker ps
# 也可以加格式化方式访问，格式会更加清爽
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}\t{{.Names}}"

# 第6步，访问网页，地址：http://虚拟机地址

# 第7步，停止容器
docker stop nginx

# 第8步，查看所有容器
docker ps -a --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}\t{{.Names}}"

# 第9步，再次启动nginx容器
docker start nginx

# 第10步，再次查看容器
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}\t{{.Names}}"

# 第11步，查看容器详细信息
docker inspect nginx

# 第12步，进入容器,查看容器内目录
docker exec -it nginx bash
# 或者，可以进入MySQL
docker exec -it mysql mysql -uroot -p

# 第13步，删除容器
docker rm nginx
# 发现无法删除，因为容器运行中，强制删除容器
docker rm -f nginx
```



####  数据卷

**数据卷**（volume）是一个虚拟目录，是 **容器内目录** 与 **宿主机目录** 之间映射的桥梁。用于将 **程序运行产生的数据、程序运行依赖的配置** 与 **容器** 解耦。

一般不让容器目录直接指向宿主机目录，避免强耦合，当宿主机改变时，只需要改变映射关系即可。

但由于数据卷目录比较深，通常我们也允许让容器 **直接与宿主目录挂载** 而不使用数据卷。



本地目录挂载演示：

``` bash
# 1.删除原来的MySQL容器
docker rm -f mysql

# 2.进入root目录
cd ~

# 3.创建并运行新mysql容器，挂载本地目录
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ROOT_PASSWORD=123 \
  -v ./mysql/data:/var/lib/mysql \
  -v ./mysql/conf:/etc/mysql/conf.d \
  -v ./mysql/init:/docker-entrypoint-initdb.d \
  mysql

# 4.查看root目录，可以发现~/mysql/data目录已经自动创建好了
ls -l mysql
# 结果：
总用量 4
drwxr-xr-x. 2 root    root   20 5月  19 15:11 conf
drwxr-xr-x. 7 polkitd root 4096 5月  19 15:11 data
drwxr-xr-x. 2 root    root   23 5月  19 15:11 init

# 查看data目录，会发现里面有大量数据库数据，说明数据库完成了初始化
ls -l data

# 5.查看MySQL容器内数据
# 5.1.进入MySQL
docker exec -it mysql mysql -uroot -p123


# 6.查看数据
# 6.1.查看数据库
show databases;
# 结果，hmall是黑马商城数据库
+--------------------+
| Database           |
+--------------------+
| hmall              |
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)
```

容器一旦创建，目录挂载就无法修改，所以需要先删除原来的容器，重新创建。

本地目录或文件必须以 `/` 或 `./`开头，如果直接以名字开头，会被识别为数据卷名而非本地目录名。



#### 镜像

镜像文件不是随意堆放的，而是按照操作的步骤分层叠加而成，每一层形成的文件都会单独打包并标记一个唯一id，称为**Layer**（**层**）

**Dockerfile**：记录镜像结构的文件



制作镜像：

``` docker
# 指定基础镜像
FROM openjdk:11.0-jre-buster
# 设定时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
# 拷贝jar包
COPY docker-demo.jar /app.jar
# 入口
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

`openjdk:11.0-jre-buster` 包含了基础的系统 + JDK 11



构建镜像：

``` bash
# 开始构建
docker build -t docker-demo:1.0 /root/demo
```

- `-t docker-demo:1.0`：指定镜像的名称为 docker-demo:1.0

- `/root/demo`：构建时 Dockerfile 所在的路径



查看镜像并运行该镜像

``` bash
# 查看镜像列表：
docker images
# 结果
REPOSITORY    TAG       IMAGE ID       CREATED          SIZE
docker-demo   1.0       d6ab0b9e64b9   27 minutes ago   327MB
nginx         latest    605c77e624dd   16 months ago    141MB
mysql         latest    3218b38490ce   17 months ago    516MB

# 1.创建并运行容器
docker run -d --name demo-container -p 8080:8080 docker-demo:1.0
# 2.查看容器
dps
# 结果
CONTAINER ID   IMAGE             PORTS                                                  STATUS         NAMES
78a000447b49   docker-demo:1.0   0.0.0.0:8080->8080/tcp, :::8090->8090/tcp              Up 2 seconds   dd
f63cfead8502   mysql             0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp   Up 2 hours     mysql

# 3.访问
curl localhost:8080/hello/count
# 结果：
<h5>欢迎访问黑马商城, 这是您第1次访问<h5>
```



#### 网络



查看容器的网络 IP

``` bash
# 1.用基本命令，寻找Networks.bridge.IPAddress属性
docker inspect mysql
# 也可以使用format过滤结果
docker inspect --format='{{range .NetworkSettings.Networks}}{{println .IPAddress}}{{end}}' mysql
# 得到IP地址如下：
172.17.0.2

# 2.然后通过命令进入dd容器
docker exec -it dd bash

# 3.在容器内，通过ping命令测试网络
ping 172.17.0.2
# 结果
PING 172.17.0.2 (172.17.0.2) 56(84) bytes of data.
64 bytes from 172.17.0.2: icmp_seq=1 ttl=64 time=0.053 ms
64 bytes from 172.17.0.2: icmp_seq=2 ttl=64 time=0.059 ms
64 bytes from 172.17.0.2: icmp_seq=3 ttl=64 time=0.058 ms
```



容器的 网络 IP 其实是一个虚拟的 IP，其值并不固定与某一个容器绑定，如果我们在开发时写死某个 IP，而在部署时很可能 MySQL 容器的 IP 会发生变化，连接会失败。



``` bash
# 1.首先通过命令创建一个网络
docker network create hmall

# 2.然后查看网络
docker network ls
# 结果：
NETWORK ID     NAME      DRIVER    SCOPE
639bc44d0a87   bridge    bridge    local
403f16ec62a2   hmall     bridge    local
0dc0f72a0fbb   host      host      local
cd8d3e8df47b   none      null      local
# 其中，除了hmall以外，其它都是默认的网络

# 3.让dd和mysql都加入该网络，注意，在加入网络时可以通过--alias给容器起别名
# 这样该网络内的其它容器可以用别名互相访问！
# 3.1.mysql容器，指定别名为db，另外每一个容器都有一个别名是容器名
docker network connect hmall mysql --alias db
# 3.2.db容器，也就是我们的java项目
docker network connect hmall dd

# 4.进入dd容器，尝试利用别名访问db
# 4.1.进入容器
docker exec -it dd bash
# 4.2.用db别名访问
ping db
# 结果
PING db (172.18.0.2) 56(84) bytes of data.
64 bytes from mysql.hmall (172.18.0.2): icmp_seq=1 ttl=64 time=0.070 ms
64 bytes from mysql.hmall (172.18.0.2): icmp_seq=2 ttl=64 time=0.056 ms
# 4.3.用容器名访问
ping mysql
# 结果：
PING mysql (172.18.0.2) 56(84) bytes of data.
64 bytes from mysql.hmall (172.18.0.2): icmp_seq=1 ttl=64 time=0.044 ms
64 bytes from mysql.hmall (172.18.0.2): icmp_seq=2 ttl=64 time=0.054 ms
```



**总结**：

- 在自定义网络中，可以给容器起多个别名，默认的别名是容器名本身
- 在同一个自定义网络中的容器，可以通过别名互相访问





### 项目部署





部署的容器及端口说明：

| **项目**     | **容器名** | **端口** | **备注**            |
| :----------- | :--------- | :------- | :------------------ |
| hmall        | hmall      | 8080     | 黑马商城后端API入口 |
| hmall-portal | nginx      | 18080    | 黑马商城用户端入口  |
| hmall-admin  | nginx      | 18081    | 黑马商城管理端入口  |
| mysql        | mysql      | 3306     | 数据库              |



#### 后端

打包 hm-service 生成 hm-service.jar，连同 dockerfile 一起上传到虚拟机。

``` bash
# 1.构建项目镜像，不指定tag，则默认为latest
docker build -t hmall .

# 2.查看镜像
docker images
# 结果
REPOSITORY    TAG       IMAGE ID       CREATED          SIZE
hmall         latest    0bb07b2c34b9   43 seconds ago   362MB
docker-demo   1.0       49743484da68   24 hours ago     327MB
nginx         latest    605c77e624dd   16 months ago    141MB
mysql         latest    3218b38490ce   17 months ago    516MB

# 3.创建并运行容器，并通过--network将其加入hmall网络，这样才能通过容器名访问mysql
docker run -d --name hmall --network hmall -p 8080:8080 hmall
```



测试：通过浏览器访问：http://你的虚拟机地址:8080/search/list



#### 前端

1. 将一下目录上传到虚拟机

   - `html`是静态资源目录，我们需要把`hmall-portal`以及`hmall-admin`都复制进去

   - `nginx.conf`是nginx的配置文件，主要是完成对`html`下的两个静态资源目录做代理

2. 创建nginx容器并完成两个 挂载

   - `hmall-portal` 和 `hmall-admin` 两套前端资源，因此我们需要暴露两个端口

测试，通过浏览器访问：http://你的虚拟机ip:18080



#### Docker Compose



稍微复杂的项目，其中还会有各种各样的其它中间件，需要部署的东西远不止3个。如果还像之前那样手动的逐一部署，就太麻烦了。

而 Docker Compose 就可以帮助我们实现 **多个相互关联的 Docker 容器的快速部署**。它允许用户通过一个单独的 docker-compose.yml 模板文件（YAML 格式）来定义一组相关联的应用容器。



docker run部署

``` bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ROOT_PASSWORD=123 \
  -v ./mysql/data:/var/lib/mysql \
  -v ./mysql/conf:/etc/mysql/conf.d \
  -v ./mysql/init:/docker-entrypoint-initdb.d \
  --network hmall
  mysql
```



`docker-compose.yml` 定义

``` yml
version: "3.8"

services:
  mysql:
    image: mysql
    container_name: mysql
    ports:
      - "3306:3306"
    environment:
      TZ: Asia/Shanghai
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - "./mysql/conf:/etc/mysql/conf.d"
      - "./mysql/data:/var/lib/mysql"
    networks:
      - new
networks:
  new:
    name: hmall
```



黑马商城的部署文件：

``` yml
version: "3.8"

services:
  mysql:
    image: mysql
    container_name: mysql
    ports:
      - "3306:3306"
    environment:
      TZ: Asia/Shanghai
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - "./mysql/conf:/etc/mysql/conf.d"
      - "./mysql/data:/var/lib/mysql"
      - "./mysql/init:/docker-entrypoint-initdb.d"
    networks:
      - hm-net
  hmall:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: hmall
    ports:
      - "8080:8080"
    networks:
      - hm-net
    depends_on:
      - mysql
  nginx:
    image: nginx
    container_name: nginx
    ports:
      - "18080:18080"
      - "18081:18081"
    volumes:
      - "./nginx/nginx.conf:/etc/nginx/nginx.conf"
      - "./nginx/html:/usr/share/nginx/html"
    depends_on:
      - hmall
    networks:
      - hm-net
networks:
  hm-net:
    name: hmall
```



教学演示：

``` bash
# 1.进入root目录
cd /root

# 2.删除旧容器
docker rm -f $(docker ps -qa)

# 3.删除hmall镜像
docker rmi hmall

# 4.清空MySQL数据
rm -rf mysql/data

# 5.启动所有, -d 参数是后台启动
# docker-compose.yml 就在当前目录
docker compose up -d
# 结果：
[+] Building 15.5s (8/8) FINISHED
 => [internal] load build definition from Dockerfile                                    0.0s
 => => transferring dockerfile: 358B                                                    0.0s
 => [internal] load .dockerignore                                                       0.0s
 => => transferring context: 2B                                                         0.0s
 => [internal] load metadata for docker.io/library/openjdk:11.0-jre-buster             15.4s
 => [1/3] FROM docker.io/library/openjdk:11.0-jre-buster@sha256:3546a17e6fb4ff4fa681c3  0.0s
 => [internal] load build context                                                       0.0s
 => => transferring context: 98B                                                        0.0s
 => CACHED [2/3] RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo   0.0s
 => CACHED [3/3] COPY hm-service.jar /app.jar                                           0.0s
 => exporting to image                                                                  0.0s
 => => exporting layers                                                                 0.0s
 => => writing image sha256:32eebee16acde22550232f2eb80c69d2ce813ed099640e4cfed2193f71  0.0s
 => => naming to docker.io/library/root-hmall                                           0.0s
[+] Running 4/4
 ✔ Network hmall    Created                                                             0.2s
 ✔ Container mysql  Started                                                             0.5s
 ✔ Container hmall  Started                                                             0.9s
 ✔ Container nginx  Started                                                             1.5s

# 6.查看镜像
docker compose images
# 结果
CONTAINER           REPOSITORY          TAG                 IMAGE ID            SIZE
hmall               root-hmall          latest              32eebee16acd        362MB
mysql               mysql               latest              3218b38490ce        516MB
nginx               nginx               latest              605c77e624dd        141MB

# 7.查看容器
docker compose ps
# 结果
NAME                IMAGE               COMMAND                  SERVICE             CREATED             STATUS              PORTS
hmall               root-hmall          "java -jar /app.jar"     hmall               54 seconds ago      Up 52 seconds       0.0.0.0:8080->8080/tcp, :::8080->8080/tcp
mysql               mysql               "docker-entrypoint.s…"   mysql               54 seconds ago      Up 53 seconds       0.0.0.0:3306->3306/tcp, :::3306->3306/tcp, 33060/tcp
nginx               nginx               "/docker-entrypoint.…"   nginx               54 secon
```



打开浏览器，访问：http://yourIp:8080





## 微服务



**单体**的电商小项目：黑马商城，基于这个单体项目来演示从单体架构到微服务架构的演变过程、分析其中存在的问题，以及微服务技术是如何解决这些问题的。



### 导入黑马商城项目



第一步：虚拟机安装 CentOS7（视频资料提供的精简版），安装的时候将网络配置成 静态IP

第二步：安装 Docker

第三步：在虚拟机上创建网络 并 安装 MySQL

第四步：运行后端，http://localhost:8080/hi

第五步：运行前端，[http://localhost:18080](http://localhost:18080/)

``` bash
# 启动nginx
start nginx.exe
# 停止
nginx.exe -s stop
# 重新加载配置
nginx.exe -s reload
# 重启
nginx.exe -s restart
```



### 认识微服务



#### 单体架构



单体架构（monolithic structure）：顾名思义，整个项目中所有功能模块都在一个工程中开发；项目部署时需要对所有模块一起编译、打包；项目的架构设计、开发模式都非常简单。

**优点**：架构简单；部署成本低

**缺点**：团队协作成本高；系统化发布效率低；系统可用性差



某一个接口使用 Jmeter 压测，会导致其他接口访问也变得缓慢。（单体架构功能之间相互影响比较大）

**单体架构适合开发功能相对简单，规模较小的项目。**



#### 微服务



微服务架构，首先是服务化，就是将单体架构中的功能模块从单体应用中拆分出来，独立部署为多个服务。同时要满足下面的一些特点：

- **单一职责**：一个微服务负责一部分业务功能，并且其核心数据不依赖于其它模块。
- **团队自治**：每个微服务都有自己独立的开发、测试、发布、运维人员，团队人员规模不超过10人。
- **服务自治**：每个微服务都独立打包部署，访问自己独立的数据库。并且要做好服务隔离，避免对其它服务产生影响。



微服务架构虽然能解决单体架构的各种问题，但在拆分的过程中，还会面临很多其它问题。比如：

- 如果出现跨服务的业务该如何处理？
- 页面请求到底该访问哪个服务？
- 如何实现各个服务之间的服务隔离？



#### Spring Cloud 微服务组件集合



SpringCloud框架可以说是目前 Java 领域最全面的微服务组件的集合。

另外，Alibaba的微服务产品 SpringCloudAlibaba 目前也成为了 SpringCloud 组件中的一员。

Spring Cloud 需要和 Spring Boot 的版本对应起来，在父功能中配置两者的依赖。



### 微服务拆分



黑马商城后端启动：

- 修改 application-local 中 DB 的配置信息
- 将 run/debug configurations 中的 active profiles 为 `local`



- **拆分原则**：高内聚、低耦合

- **拆分方式**

  - 纵向拆分：按照项目的功能模块来拆分。

  - 横向拆分：各个功能模块之间有没有公共的业务部分，如果有将其抽取出来作为通用服务。（有点像 AOP）



一般微服务项目有两种不同的工程结构：

- 完全解耦：每一个微服务都创建为一个独立的工程 Project，甚至可以使用不同的开发语言来开发，项目完全解耦。
  - 优点：服务之间耦合度低
  - 缺点：每个项目都有自己的独立仓库，管理起来比较麻烦
- Maven 聚合：整个项目为一个 Project，然后每个微服务是其中的一个 Module
  - 优点：项目代码集中，管理和运维方便
  - 缺点：服务之间耦合，编译时间较长



在拆分的时候，我们发现一个问题：就是购物车业务中需要查询商品信息，但商品信息查询的逻辑全部迁移到了`item-service`服务，导致我们无法查询。

把原本本地方法调用，改造成跨微服务的远程调用（RPC，即 **R**emote **P**roduce **C**all）。

远程调用：在cart-service中模拟浏览器，发送http请求到item-service



Spring给我们提供了一个 RestTemplate 的 API，可以方便的实现Http请求的发送。



**具体实例**

背景：购物车业务中需要显示当前价格和加入购物车时的价格变动，需要调用到商品业务的代码。

``` java
// 查询商品

// 原来的写法
// 另外还需要 注入 itemService
List<ItemDTO> items = itemService.queryItemByIds(itemIds);  // 需要修改的部分


// restTemplate
// 另外还需要 注册 RestTemplate 到 Spring 容器
ResponseEntity<List<ItemDTO>> response = restTemplate.exchange(
        "http://localhost:8081/items?ids={ids}",
        HttpMethod.GET,
        null,
        new ParameterizedTypeReference<List<ItemDTO>>() {
        },
        Map.of("ids", CollUtil.join(itemIds, ","))
);
// 解析响应
if(!response.getStatusCode().is2xxSuccessful()){
    // 查询失败，直接结束
    return;
}
List<ItemDTO> items = response.getBody();
```



### Nacos 服务注册、发现和负载均衡



上面这种手动发送Http请求的方式存在一些问题。

试想一下，假如商品微服务被调用较多，为了应对更高的并发，我们进行了多实例部署，此时每个`item-service`的实例其IP或端口不同，问题来了：

- item-service 这么多实例，cart-service如何知道每一个实例的地址？
- http 请求要写 url 地址，`cart-service`服务到底该调用哪个实例呢？
- 如果在运行过程中，某一个`item-service`实例宕机，`cart-service`依然在调用该怎么办？
- 如果并发太高，`item-service`临时多部署了 N 台实例，`cart-service`如何知道新实例的地址？



为了解决上述问题，就必须引入 **注册中心**。

在远程调用的过程中，包括两个角色：

- 服务提供者：提供接口供其它微服务访问，比如`item-service`
- 服务消费者：调用其它微服务提供的接口，比如`cart-service`



在大型微服务项目中，服务提供者的数量会非常多，为了管理这些服务就引入了 **注册中心** 的概念。

- 注册中心：推送变更到服务调用者
- 服务提供者：在注册中心注册服务并保持心跳检测
- 服务调用者：从注册中心订阅服务，远程调用服务提供者，同时对实例列表进行 **负载均衡** 



目前开源的注册中心框架有很多，国内比较常见的有：

- Eureka：Netflix 公司出品，目前被集成在 SpringCloud 当中，一般用于 Java 应用
- Nacos：Alibaba 公司出品，目前被集成在 SpringCloudAlibaba 中，一般用于 Java 应用
- Consul：HashiCorp 公司出品，目前集成在 SpringCloud 中，不限制微服务语言

由于 Nacos 是国内产品，中文文档比较丰富，而且同时具备 **配置管理** 功能，因此在国内使用较多，课堂中我们会 Nacos 为例来学习。



部署 Nacos：

1. 导入 SQL 到 docker 的mysql 容器
2. 在 docker 中创建 nacos 容器



访问：http://192.168.137.101:8848/nacos/

账号名和密码都是 nacos



#### 服务注册



第一步：添加依赖

``` xml
<!--nacos 服务注册发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

第二步：配置 Nacos

``` yaml
spring:
  application:
    name: item-service # 服务名称
  cloud:
    nacos:
      server-addr: 192.168.150.101:8848 # nacos地址
```

第三步：启动服务实例

可以在服务中通过右键服务来创建多个实例，注意重命名并且配置新的端口，避免冲突。

访问 nacos 控制台，可以发现服务注册成功。



#### 服务发现和负载均衡



前两步和服务注册一致，即 服务注册和发现都被封装在 `spring-cloud-starter-alibaba-nacos-discovery`，因为任何一个微服务都可以调用别人，也可以被别人调用，即可以是调用者，也可以是提供者。同时都需要指定 nacos 地址。

第三步：服务发现

``` java
private final DiscoveryClient discoverClient;

private void hadleCartItems(List<CartVO> vos) {
    List<ServiceInstance> instances = discoveryclient.getInstances("item-service");
    if(collutil.isEmpty(instances)){
        return;
    }
	// 手写负载均衡，从实例列表中随机挑选一个实例
	ServiceInstance instance = instances.get(RandomUtil.randomInt(instances.size()));
	// 利用RestTemplate发起http请求，得到http的响应
	ResponseEntity<List<ItemDTO>>response = restTemplate.exchange(
			url: instance.getUri()+"/items?ids=fids}",
			HttpMethod.GET,
        null,
        new ParameterizedTypeReference<List<ItemDTO>>() {
        },
        Map.of("ids", CollUtil.join(itemIds, ","))
	);
    // 其他业务逻辑
}
```

主要就是 url 不写死了，可以关注 [微服务拆分](###微服务拆分) 中两者的区别。



### OpenFeign



OpenFeign 的设计宗旨是 简化 Java Http 客户端的开发（简化远程调用）

上面利用 RestTemplate 的远程调用的代码太复杂了，我们想要让 **远程调用像本地方法调用一样简单**，这就可以用 OpenFeign组件来解决。

远程调用的关键点其实就四个：**请求方式、请求路径、请求参数、返回值类型**。

OpenFeign 就利用 SpringMVC 的 **相关注解** 来声明上述4个参数，然后基于动态代理帮我们生成远程调用的代码，而无需我们手动再编写，非常方便。



#### 快速入门



第一步：引入依赖

``` xml
  <!--openFeign-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-openfeign</artifactId>
  </dependency>
  <!--负载均衡器-->
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-loadbalancer</artifactId>
  </dependency>
```

第二步：在调用者启动类上添加注解 `@EnableFeignClients`

第三步：定义接口，编写 Feign 客户端

``` java
@FeignClient("item-service")
public interface ItemClient {

    @GetMapping("/items")
    List<ItemDTO> queryItemByIds(@RequestParam("ids") Collection<Long> ids);
}
```

这里只需要声明接口，无需实现方法。接口中的几个关键信息：

- `@FeignClient("item-service")` ：声明服务名称
- `@GetMapping` ：声明请求方式 和 请求路径
- `@RequestParam("ids") Collection<Long> ids` ：声明请求参数
- `List<ItemDTO>` ：返回值类型

第四步：使用 FeignClient

和最初类似的写法即可。

``` java
private final ItemClient itemClient;
List<ItemDTO> items = itemClient.queryItemByIds(itemIds);
```



#### 连接池



Feign底层发起 http 请求，依赖于其它的框架。其底层支持的http客户端实现包括：

- HttpURLConnection：默认实现，不支持连接池
- Apache HttpClient ：支持连接池
- OKHttp：支持连接池

因此我们通常会使用带有连接池的客户端来代替默认的 HttpURLConnection 。比如，我们使用OK Http.



第一步：引入依赖

``` xml
<!--OK http 的依赖 -->
<dependency>
  <groupId>io.github.openfeign</groupId>
  <artifactId>feign-okhttp</artifactId>
</dependency>
```

第二步：配置连接池

``` yml
feign:
  okhttp:
    enabled: true # 开启OKHttp功能
```



由于我们在另外的微服务中也可能使用到 item-service 的接口，难道需要再次定义 ItemClient 接口吗？

避免重复编码的方法就是 抽取，有两种思路：

- 抽取到微服务之外的公共 module
- 每个微服务自己抽取一个 module

这里我们采用第一种。



第一步：定义一个新的 module，命名为 hm-api

第二步：引入 OpenFeign 相关依赖

第三步：拷贝公共内容进来（比如 ItemDTO和 ItemClient ）

第四步：其他微服务引入 hm-api 依赖，同时在调用者启动类的 OpenFeign 注解上添加扫描包的地址。

`@EnableFeignClients(basePackages = "com.hmall.api.client")`



#### 日志配置



OpenFeign 只会在 FeignClient 所在包的日志级别为 **DEBUG** 时，才会输出日志。而且其日志级别有4级：

- **NONE**：不记录任何日志信息（默认值）
- **BASIC**：仅记录请求的方法，URL以及响应状态码和执行时间
- **HEADERS**：在BASIC的基础上，额外记录了请求和响应的头信息
- **FULL**：记录所有请求和响应的明细，包括头信息、请求体、元数据



想要定义日志级别，可以通过以下方式：

第一步：创建配置类

``` java

public class DefaultFeignConfig {
    @Bean
    public Logger.Level feignLogLevel(){
        return Logger.Level.FULL;
    }
}
```

第二步：让日志级别生效

- **局部**生效：在某个`FeignClient`中配置，只对当前`FeignClient`生效

```Java
@FeignClient(value = "item-service", configuration = DefaultFeignConfig.class)
```

- **全局**生效：在`@EnableFeignClients`中配置，针对所有`FeignClient`生效。

```Java
@EnableFeignClients(defaultConfiguration = DefaultFeignConfig.class)
```



### 网关 路由



网关路由，解决前端请求入口的问题。

网关就是网络的关口。数据在网络间传输，从一个网络传输到另一网络时就需要经过 **网关** 来做数据的 **路由** 和 **转发** 以及数据安全的 **校验**。

前端请求不能直接访问微服务，而是要请求网关：

- 网关可以做安全控制，也就是登录身份校验，校验通过才放行
- 通过认证后，网关再根据请求判断应该访问哪个微服务，将请求转发过去



在 SpringCloud 当中，提供了两种网关实现方案：

- Netflix Zuul：早期实现，目前已经淘汰
- SpringCloudGateway：基于 Spring 的 WebFlux 技术，完全支持响应式编程，吞吐能力更强（我们采用这种方案）



网关本身也是一个独立的微服务，因此也需要创建一个模块开发功能。

第一步：创建新的 module，命名为 hm-gateway

第二步：引入相关依赖（网关`spring-cloud-starter-gateway`, nacos 注册中心 `spring-cloud-starter-alibaba-nacos-discovery`, 负载均衡`spring-cloud-starter-loadbalancer`等）

第三步：新建启动类，配置yml

``` yml
server:
  port: 8080
spring:
  application:
    name: gateway
  cloud:
    nacos:
      server-addr: 192.168.137.101:8848
    gateway:
      routes:
        - id: item # 路由规则id，自定义，唯一
          uri: lb://item-service # 路由的目标服务，lb代表负载均衡，会从注册中心拉取服务列表
          predicates: # 路由断言，判断当前请求是否符合当前规则，符合则路由到目标服务
            - Path=/items/**,/search/** # 这里是以请求路径作为判断规则
        - id: cart
          uri: lb://cart-service
          predicates:
            - Path=/carts/**
        - id: user
          uri: lb://user-service
          predicates:
            - Path=/users/**,/addresses/**
        - id: trade
          uri: lb://trade-service
          predicates:
            - Path=/orders/**
        - id: pay
          uri: lb://pay-service
          predicates:
            - Path=/pay-orders/**
      # default-filters:
        # ...
```

第四步：启动并测试

以 http://localhost:8080 拼接微服务接口路径来测试。例如：http://localhost:8080/items/page?pageNo=1&pageSize=1



网关路由对应的 Java 类型是 RouteDefinition，其中常见的属性有：

- id：路由唯一标识
- uri：路由目标地址
- predicates：路由断言，判断请求是否符合当前路由
  - Route Predicate Factories 提供了 12 种路由断言，path就是其中的一种
- filters：路由过滤器，对请求或响应做特殊处理
  - GatewayFilter Factories 提供了三十多种路由过滤器
  - 可以写到 和 routes 平级，default-filters 实现默认路由，所有都生效

可以参考：https://docs.spring.io/spring-cloud-gateway/docs/4.0.9/reference/html/



### 网关 登录校验



网关是所有微服务的入口，一切请求都需要先经过网关。我们完全可以把 **登录校验** 的工作放到网关去做，这样之前说的问题就解决了：

- 只需要在网关和用户服务保存秘钥
- 只需要在网关开发登录校验功能



网关 Gateway 内部工作流程：

1. 客户端
2. HandlererMapper：根据路径匹配 Route
3. FilteringWebHandler：加载并调用路由下的过滤器链
4. Filter：网关过滤器链中的过滤器
5. NettyRoutingFilter：把请求发送到具体微服务
6. 微服务

我们需要定义一个过滤器，在其中实现登录校验逻辑，并且将过滤器执行顺序定义到`NettyRoutingFilter`之前。

网关过滤器链中的过滤器有两种：

- `GatewayFilter`：路由过滤器，作用范围比较灵活，可以是任意指定的路由`Route`. 
- `GlobalFilter`：全局过滤器，作用范围是所有路由，不可配置。

其实`GatewayFilter`和`GlobalFilter`这两种过滤器的方法签名完全一致，`FilteringWebHandler`在处理请求时，会将`GlobalFilter`装饰为`GatewayFilter`，然后放到同一个过滤器链中，排序以后依次执行。



自定义过滤器：

- 自定义 GatewayFilter
  - extends AbstractGatewayFilterFactory
- 自定义 GlobalFilter
  - implements GlobalFilter



**具体实例**：

利用自定义 GlobalFilter 来完成登录校验。

 第一步：将原本 JWT 的相关内容拷贝过来

第二步：实现自定义过滤器



考虑到微服务内部可能很多地方都需要用到登录用户信息，因此我们可以利用 SpringMVC 的拦截器来实现登录用户信息获取，并存入ThreadLocal，方便后续使用。

- 改造 **网关过滤器**，在获取用户信息后保存到请求头，转发到下游微服务
- 编写 **微服务拦截器**，拦截请求获取用户信息，保存到ThreadLocal后放行



微服务调用其他微服务时，也可能需要用户信息，需要存入 请求头。

微服务之间的调用使用 OpenFeign 实现的，可以借助 Feign 中提供的一个拦截器接口：`feign.RequestInterceptor` 来使得每一个由 OpenFeign 发起的请求也自动携带登录用户信息。



### Nacos 配置管理



微服务共享的配置可以统一交给 Nacos 保存和管理，在 Nacos 控制台修改配置后，Nacos 会将配置变更推送给相关的微服务，并且无需重启即可生效，实现配置热更新。



**配置共享**

第一步：抽取共享配置到 Nacos 管理平台

第二步：拉取共享配置

SpringCloud在初始化上下文的时候会先读取一个名为`bootstrap.yaml`(或者`bootstrap.properties`)的文件，如果我们将 nacos 地址配置到`bootstrap.yaml`中，那么在项目引导阶段就可以读取 nacos 中的配置了。

- 引入依赖（nacos配置管理`spring-cloud-starter-alibaba-nacos-config`，读取bootstrap文件`spring-cloud-starter-bootstrap`）
- 在微服务 resource 目录下新建 bootstrap.yaml 文件（保存 nacos 地址，以及要拉取的共享配置）
- 修改 application.yaml ，删除公共配置的内容



**配置热更新**

定义：当修改配置文件中的配置时，微服务 **无需重启** 即可是配置生效。

第一步：在 Nacos 中添加配置

有一个与微服务名有关的配置文件：微服务名称-项目profile(可选).文件后缀名（和 bootstrap 里面的对应起来）

第二步：在微服务读取配置

在微服务中新建一个属性读取类，然后再业务代码中使用该属性

推荐用 `@ConfigurationProperties` 而不是 `@Value`

``` java
@Data
@Component
@ConfigurationProperties(prefix = "hm.cart")
public class CartProperties {
    private Integer maxAmount;
}
```



**动态路由**（算了算了）

网关的路由配置全部是在项目启动时由`org.springframework.cloud.gateway.route.CompositeRouteDefinitionLocator` 在项目启动的时候加载，并且一经加载就会缓存到内存中的路由表内（一个Map），不会改变。也不会监听路由变更，所以，我们无法利用上节课学习的配置热更新来实现路由更新。



## 服务保护和分布式事务



### 微服务保护



#### 服务保护方案



- 请求限流：降低了并发上限（设置接口的并发流量 QPS）

- 线程隔离：降低了可用资源的数量（设置某一微服务可用线程的上限 并发线程数）

- 服务熔断：降低了服务完整度（编写服务降级逻辑，异常统计和熔断）

  

#### 请求限流



Sentinel是阿里巴巴开源的一款服务保护框架，目前已经加入 SpringCloudAlibaba 中。



第一步：下载 sentinel-dashboard.jar

第二步：运行 `java -Dserver.port=8090 -Dcsp.sentinel.dashboard.server=localhost:8090 -Dproject.name=sentinel-dashboard -jar sentinel-dashboard.jar`

第三步：访问 [http://localhost:8090](http://localhost:8080/)（账号密码都是 sentinel）

第四步：微服务整合

- 引入依赖 `spring-cloud-starter-alibaba-sentinel`
- 修改配置文件（设置开启请求前缀，这样可以统计统一前缀的接口）
- 启动微服务，访问控制台即可看到统计信息，在控制台可以设置流控规则，设置 QPS 上限。



#### 线程隔离



限流可以降低服务器压力，尽量减少因并发流量引起的服务故障的概率，但并不能完全避免服务故障。一旦某个服务出现故障，我们必须隔离对这个服务的调用，避免发生雪崩。



OpenFeign 整合 Sentinel

只需要修改配置文件，开启 Feign 的 Sentinel 功能即可，这样 FeignClient 自动变成了一个簇点资源（Sentinel 控制台对接口的叫法）

控制台修改流控规则，设置并发线程数上限。



#### 服务熔断



**编写降级逻辑**

触发限流或熔断后的请求不直接报错，而是返回友好提示。

第一步：编写降级处理类 `implements FallbackFactory`，重写 create 方法。

第二步：在 **网关模块** 将降级处理类注册为一个 bean

第三部：在 网关模块 的 ItemClient 接口的 @FeignClient 注解中加上 降级处理类



**服务熔断**

对于出问题的接口，应该停止调用，走降级逻辑。

我们可以利用 Sentinel 中的断路器，它不仅可以统计某个接口的**慢请求比例**，还可以统计**异常请求比例**。当这些比例超出阈值时，就会**熔断**该接口，即拦截访问该接口的一切请求，降级处理；当该接口恢复正常时，再放行对于该接口的请求。

断路器的工作状态：

- closed：关闭状态，放行所有请求
- open：打开状态，拒绝所有请求，open 状态持续一段时间后会进入 half-open 状态
- half-open：半开状态，放行一次请求，根据结果判断后续操作，请求成功则切换到 close 状态，失败则切换到 open 状态。

可以通过在 Sentinel 的控制台簇点资源后面的熔断，来配置触发熔断条件



### 分布式事务



#### 初识分布式事务



在分布式系统中，如果一个业务需要多个服务合作完成，而且每一个服务都有事务，多个事务必须同时成功或失败，这样的事务就是 **分布式事务**。其中每个服务的事务就是一个**分支事务**。整个业务称为**全局事务**。

可能产生分布式事务问题的原因：

- 业务跨多个服务实现
- 业务跨多个数据源实现



#### Seata



在众多的开源分布式事务框架中，功能最完善、使用最多的就是阿里巴巴在 2019 年开源的 Seata 了。

分布式事务产生的一个重要原因，就是参与事务的多个分支事务 **互相无感知**，不知道彼此的执行状态。因此解决分布式事务的思想非常简单找一个统一的**事务协调者**，与多个分支事务通信，检测每个分支事务的执行状态，保证全局事务下的每一个分支事务同时成功或失败即可。大多数的分布式事务框架都是基于这个理论来实现的。



Seata 的事务管理中有三个重要角色：

-  **TC (Transaction Coordinator) - 事务协调者**：维护全局和分支事务的状态，协调全局事务提交或回滚。 
-  **TM (Transaction Manager) - 事务管理器**：定义全局事务的范围、开始全局事务、提交或回滚全局事务。 
-  **RM (Resource Manager) - 资源管理器**：管理分支事务，与TC交谈以注册分支事务和报告分支事务的状态，并驱动分支事务提交或回滚。 

**TM** 和 **RM** 可以理解为 Seata 的客户端部分，引入到参与事务的微服务依赖中即可。**TM**和**RM**会协助微服务，实现本地分支事务与 **TC** 之间交互，实现事务的提交或回滚。

**TC** 服务则是事务协调中心，是一个独立的微服务，需要单独部署。



**部署 TC 服务**

第一步：导入准备的 SQL

第二步：导入准备的 seata 文件

第三步：docker 部署（docker run）



**微服务集成 Seata**

参与分布式事务的每一个微服务都需要集成Seata。

第一步：引入依赖

- spring-cloud-starter-alibaba-nacos-config：用于同步 seata 的共享配置
- spring-cloud-starter-bootstrap：读取 bootstrap 文件
- spring-cloud-starter-alibaba-seata：seata

第二步：修改配置

在 nacos 上添加 共享的 seata 配置

在微服务中添加 bootstrap 文件

第三步：添加 SQL

seata的客户端在解决分布式事务的时候需要记录一些中间数据，保存在数据库中。因此我们要先准备一个这样的表。

第四步：应用 seata

在分布式业务上添加 seata 提供的 `@GlobalTransactional`，替换原来的 `@Transactional`



Seata支持四种不同的分布式事务解决方案：

- **XA**
- **TCC**
- **AT**
- **SAGA**

下面介绍 XA 和 AT。



XA 规范 描述了全局的`TM`与局部的`RM`之间的接口，几乎所有主流的数据库都对 XA 规范 提供了支持。

**XA  规范实现的原理基于 二阶段提交**。

**两阶段提交**

- 一阶段：事务协调者通知每个事务参与者执行本地事务，执行完成后报告结果给事务协调者，此时事务不提交，继续持有数据库锁。
- 二阶段：事务协调者基于一阶段的报告结果来判断下一步操作，全体提交事务或回滚事务。



seata 的 XA 模型：对原始的XA模式做了简单的封装和改造。

**一阶段**

TM 向 TC 注册一个全局事务，开始调用分支事务。

RM 会拦截 TM 对数据库的操作，会先向 TC 注册一下分支事务，属于哪个全局，然后执行并向 TC 报告结果。

**二阶段**

TC 检查所有分支事务的状态，若成功，则让所有事务提交，释放锁，否则回滚。



具体实现：

第一步：设置 nacos 的共享配置

``` yml
seata:
  data-source-proxy-mode: XA
```

第二步：`@GlobalTransactional`注解分布式事务的入口方法



**AT 模式**

`AT`模式同样是分阶段提交的事务模型，不过缺弥补了`XA`模型中资源锁定周期过长的缺陷。

区别就是 RM 在第一阶段使用了 undo-log 记录操作，提交sql，第二阶段根据 TC 指示，删除 undo-log 或 根据 undo-log 进行回滚操作。



AT模式使用起来更加简单，无业务侵入，性能更好。因此企业90%的分布式事务都可以用AT模式来解决。

