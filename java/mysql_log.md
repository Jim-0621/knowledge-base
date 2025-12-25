# MySQL 三大日志

## bin log



### 常用命令

#### 查看 bin log 配置

``` sql
show variables like '%log_bin%';
```

| Variable_name                   | Value                                                        | 说明               |
| ------------------------------- | ------------------------------------------------------------ | ------------------ |
| log_bin                         | ON                                                           | 是否开启 binlog    |
| log_bin_basename                | C:\ProgramData\MySQL\MySQL Server 8.4\Data\DESKTOP-S0UD4US-bin | bin log 所在文件夹 |
| log_bin_index                   | C:\ProgramData\MySQL\MySQL Server 8.4\Data\DESKTOP-S0UD4US-bin.index | binlog 的索引文件  |
| log_bin_trust_function_creators | OFF                                                          |                    |
| sql_log_bin                     | ON                                                           | 用于主从复制       |



#### 查看 bin log 文件

``` sql
show binary logs;
```

| Log_name                   | File_size  | Encrypted |
| -------------------------- | ---------- | --------- |
| DESKTOP-S0UD4US-bin.000003 | 1118341094 | No        |
| DESKTOP-S0UD4US-bin.000004 | 773235679  | No        |

Encrypted: 是否加密



#### 查看 bin log 记录的类型

``` java
SHOW VARIABLES LIKE 'binlog_format';
```

| Variable_name | Value |
| ------------- | ----- |
| binlog_format | ROW   |

binlog 记录的类型有三种，一种是 `STATEMENT`，一种是 `ROW`，一种是 `MIXED`。

- `STATEMENT`：记录的是 SQL 语句，适用于简单 SQL 语句的场景。可读性好，占用空间大，但是可能会出现数据不一致的情况。
- `ROW`：记录的时数据行的变更，包含变更前后的内容。可读性差，占用空间小，但是避免了数据不一致。
- `MIXED`：根据具体的情况来选择 `STATEMENT` 或者是 `ROW` 其中一种类型来进行存储。



#### 查看相应时间段内的 bin log

终端运行，"" 内的内容需要按照实际情况修改

``` bash
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqlbinlog.exe" --base64-output=decode-rows -vv --start-datetime="2024-08-06 15:00:00" --stop-datetime="2024-08-06 17:00:00" --set-charset=utf8 "C:\ProgramData\MySQL\MySQL Server 8.4\Data\DESKTOP-S0UD4US-bin.000004" > "C:\Users\admin\Desktop\sql_record.txt"
```



### 简介



binlog 记录了对MySQL数据库执行更改的所有的**写操作**，包括所有对数据库的数据、表结构、索引等等变更的操作。

**主要应用场景**：

- **主从复制** ：
  - 主服务器 记录写记录到 bin log
  - 主服务器 启动线程发送 bin log
  - 从服务器 启动线程接收 bin log，保存到 relay log
  - 从服务器 启动线程重放 relay log
- **数据恢复** ：通过使用 mysqlbinlog 工具来恢复数据。
  - 相关推荐：[查看相应时间段内的 bin log](####查看相应时间段内的 bin log)



### 数据格式

binlog 记录的数据格式有三种，一种是 `STATEMENT`，一种是 `ROW`，一种是 `MIXED`。

- `STATEMENT`：记录的是 SQL 语句，适用于简单 SQL 语句的场景。可读性好，占用空间大，但是可能会出现数据不一致的情况。（MySQL 5.7.7 之前的默认格式）
- `ROW`：记录的时数据行的变更，包含变更前后的内容。可读性差，占用空间小，但是避免了数据不一致。（MySQL 5.7.7 之后的默认格式）
- `MIXED`：根据具体的情况来选择 `STATEMENT` 或者是 `ROW` 其中一种类型来进行存储。



### 写入策略

对于 InnoDB 存储引擎而言，在进行 **事务** 的过程中，首先会把binlog 写入到binlog cache中（因为写入到cache中会比较快，一个事务通常会有多个操作，避免每个操作都直接写磁盘导致性能降低），只有在事务提交时才会记录 big log ，此时记录还在内存中，那么 big log 是什么时候刷到磁盘中的呢？

MySQL 其实是通过 sync_binlog 参数控制 big log 的刷盘时机，取值范围是 0-N：

- **0**：每次提交事务bin log不会马上写入到磁盘，而是先写到page cache。不去强制要求，由系统自行判断何时写入磁盘，在Mysql 崩溃的时候会有丢失日志的风险；
- **1**：每次提交事务都会执行 fsync 将 bin log 写入到磁盘；
- **N**：每次提交事务都先写到page cach，只有等到积累了N个事务之后才 fsync 将 bin log 写入到磁盘，在 MySQL 崩溃的时候会有丢失N个事务日志的风险。

很显然三种模式下，**sync_binlog=1 是强一致的选择**，选择0或者N的情况下在极端情况下就会有丢失日志的风险，具体选择什么模式还是得看系统对于一致性的要求。



## redo log



### 简介

redo log 是属于引擎层(innodb)的日志，事务提交成功由 redo log 来保证 **数据持久性**。

**应用场景**：崩溃恢复 crash-safe



###  数据格式

- 内存的 日志缓存(redo log buffer)
- 磁盘的 日志文件(redo log file)

MySQL 每执行一条 DML 语句（增删改查），先将记录写入 redo log buffer，后续某个时间点再一次性将多个操作记录写到 redo log file。

Tips: 实际上 redo log buffer 先写到 OS buffer，然后系统调用 fsync() 将其刷到 redo log file，因为用户空间无法直接写磁盘。



### 写入策略

当redo log空间满了之后又会从头开始以循环的方式进行覆盖式的写入。MySQL 支持三种将 redo log buffer 写入 redo log file 的时机，可以通过 innodb_flush_log_at_trx_commit 参数配置，各参数含义如下：

- **0（延迟写）**：表示每次事务提交时都只是把 redo log 留在 redo log buffer 中，开启一个后台线程，每**1s**刷新一次到磁盘中 ;
- **1（实时写，实时刷）**：表示每次事务提交时都将 redo log 直接持久化到磁盘，真正保证数据的持久性；
- **2（实时写，延迟刷）**：表示每次事务提交时都只是把 redo log 写到 page cache，具体的刷盘时机不确定。

除了上面几种机制外，还有其它两种情况会把redo log buffer中的日志刷到磁盘。

- **定时处理**：有线程会定时(每隔 1 秒)把redo log buffer中的数据刷盘。
- **根据空间处理**：redo log buffer 占用到了一定程度( innodb_log_buffer_size 设置的值一半)占，这个时候也会把redo log buffer中的数据刷盘。



## bin log 和 redo log



**同为操作数据变更的日志，有了binlog为什么还要redo log？**

**核心在于**：两者记录的数据变更粒度不一样。bin log 已表为记录主体，redo log 以磁盘数据为记录主体。当数据库宕机时，可能出现表中一部分数据更新，一部分数据没有更新。数据可能在磁盘的多个扇区。



|          | bin log                                              | redo log                                 |
| -------- | ---------------------------------------------------- | ---------------------------------------- |
| 文件大小 | 可以通过 max_binlog_size 配置                        | 固定                                     |
| 实现方式 | server 层实现，所有引擎都可以使用                    | InnoDB 引擎实现，只有它有                |
| 记录方式 | 追加的方式记录，文件超过指定大小后，记录到新的文件上 | 循环写的方式记录，写到结尾后，回到开头写 |
| 使用场景 | 主从复制                                             | 崩溃恢复 crash-safe                      |



- **redo log 物理日志**：记录内容是“在xx数据页做了xx修改”，属于InnoDB存储引擎层产生的。
- **bin log 逻辑日志**：记录内容是语句的原始逻辑，类似于给ID=2这一行的c字段加1，属于服务层。



## undo log



### 简介



undo log 是也属于引擎层(Innodb)的日志， 事务回滚由 undo log 来保证 **原子性**。

**应用场景**：

- 事务回滚
- MVCC



### 数据格式



主要有以下两类记录：

- insert undo log: 新增操作只对事务本身可见，事务提交后即可直接删除。
- update undo log: 删除和更新操作可能需要用于提供 MVCC 机制，事务提交时不能删除。

undo log 保存的时历史操作的记录。

InnoDB中，每个行记录除了记录本身的数据之外，还有几个隐藏的列：

- **DB_ROW_ID**∶记录的主键id。
- **DB_TRX_ID**：事务ID，当对某条记录发生修改时，就会将这个事务的Id记录其中。
- **DB_ROLL_PTR**︰回滚指针，版本链中的指针。



在 InnoDB 存储引擎中，undo log 使用 rollback segment 回滚段进行存储，每隔回滚段包含了1024个 undo log segment。MySQL5.5之后，一共有128个回滚段。即总共可以记录128 * 1024个undo操作。

Tips: 每个事务只会使用一个回滚段，一个回滚段在同一时刻可能会服务于多个事务。



每次对数据的变更都会产生一个undo log，当一条记录被变更多次时，那么就会产生多条undo log，undo log记录的是变更前的日志，并且每个undo log的序号是递增的，那么当要回滚的时候，按照序号依次向前推，就可以找到我们的原始数据了。



### 写入策略

事务执行过程中，先把日志写到 bin log cache ，事务提交的时候，再把bin log cache 写到 bin log 文件中。因为**一个事务的 bin log 不能被拆开**，无论这个事务多大，也要确保一次性写入，所以系统会给每个线程分配一个块内存作为 binlog cache。