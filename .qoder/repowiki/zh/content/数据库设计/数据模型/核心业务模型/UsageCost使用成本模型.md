# UsageCost使用成本模型

<cite>
**本文档引用的文件**
- [schema.prisma](file://prisma/schema.prisma)
- [cost.ts](file://src/lib/billing/cost.ts)
- [service.ts](file://src/lib/billing/service.ts)
- [reporting.ts](file://src/lib/billing/reporting.ts)
- [ledger.ts](file://src/lib/billing/ledger.ts)
- [money.ts](file://src/lib/billing/money.ts)
- [image-video.pricing.json](file://standards/pricing/image-video.pricing.json)
- [cost.test.ts](file://tests/unit/billing/cost.test.ts)
- [service.test.ts](file://tests/unit/billing/service.test.ts)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

UsageCost是Waoowaoo计费系统的核心实体，用于追踪和管理用户在平台各项服务中的使用成本。该模型实现了统一的计费框架，支持文本、图像、视频、语音等多种API类型的差异化定价策略。

UsageCost实体的设计理念基于以下核心原则：
- **统一性**：所有计费操作都通过UsageCost实体进行持久化记录
- **可追溯性**：完整的成本追踪和审计能力
- **灵活性**：支持多种计价模式和自定义定价
- **准确性**：精确到分的货币处理和四舍五入机制

## 项目结构

计费系统的文件组织遵循清晰的分层架构：

```mermaid
graph TB
subgraph "计费核心层"
A[schema.prisma<br/>数据库模型定义]
B[cost.ts<br/>成本计算逻辑]
C[service.ts<br/>计费服务接口]
end
subgraph "基础设施层"
D[ledger.ts<br/>余额和冻结管理]
E[reporting.ts<br/>报告和查询]
F[money.ts<br/>货币处理工具]
end
subgraph "定价标准层"
G[image-video.pricing.json<br/>内置定价目录]
end
subgraph "测试层"
H[cost.test.ts<br/>单元测试]
I[service.test.ts<br/>集成测试]
end
A --> B
B --> C
C --> D
C --> E
G --> B
H --> B
I --> C
```

**图表来源**
- [schema.prisma:380-400](file://prisma/schema.prisma#L380-L400)
- [cost.ts:1-742](file://src/lib/billing/cost.ts#L1-L742)
- [service.ts:1-800](file://src/lib/billing/service.ts#L1-L800)

**章节来源**
- [schema.prisma:1-800](file://prisma/schema.prisma#L1-L800)
- [cost.ts:1-742](file://src/lib/billing/cost.ts#L1-L742)

## 核心组件

### UsageCost实体定义

UsageCost作为计费系统的核心数据模型，具有以下关键属性：

| 字段名 | 数据类型 | 约束条件 | 业务含义 |
|--------|----------|----------|----------|
| id | String | 主键，UUID | 记录唯一标识符 |
| projectId | String | 外键，非空 | 关联项目标识 |
| userId | String | 外键，非空 | 关联用户标识 |
| apiType | String | 枚举值，非空 | API类型：text/image/video/voice/voice-design/lip-sync |
| model | String | 非空 | 使用的具体模型标识 |
| action | String | 非空 | 业务动作类型 |
| quantity | Integer | 非负整数 | 使用量或数量 |
| unit | String | 枚举值，非空 | 计量单位：token/image/video/second/call |
| cost | Decimal(18,6) | 非负，精度6位小数 | 实际产生费用 |
| metadata | String | JSON格式，可选 | 扩展元数据信息 |
| createdAt | DateTime | 默认当前时间 | 记录创建时间 |

### 关联关系设计

UsageCost与核心实体的关联关系：

```mermaid
erDiagram
USAGE_COST {
string id PK
string projectId FK
string userId FK
string apiType
string model
string action
int quantity
string unit
decimal cost
string metadata
datetime createdAt
}
PROJECT {
string id PK
string name
string description
string userId FK
datetime createdAt
datetime updatedAt
}
USER {
string id PK
string name UK
string email
string password
datetime createdAt
datetime updatedAt
}
USAGE_COST ||--|| PROJECT : "属于"
USAGE_COST ||--|| USER : "由用户产生"
```

**图表来源**
- [schema.prisma:380-415](file://prisma/schema.prisma#L380-L415)

**章节来源**
- [schema.prisma:380-400](file://prisma/schema.prisma#L380-L400)

## 架构概览

计费系统采用分层架构设计，确保职责分离和模块化：

```mermaid
graph TD
subgraph "外部接口层"
A[API请求]
B[任务调度]
end
subgraph "服务协调层"
C[计费服务<br/>service.ts]
D[成本计算<br/>cost.ts]
end
subgraph "基础设施层"
E[余额管理<br/>ledger.ts]
F[数据持久化<br/>Prisma ORM]
G[报告查询<br/>reporting.ts]
end
subgraph "数据存储层"
H[UsageCost表]
I[UserBalance表]
J[BalanceFreeze表]
K[BalanceTransaction表]
end
A --> C
B --> C
C --> D
C --> E
D --> F
E --> F
F --> H
F --> I
F --> J
F --> K
style C fill:#e1f5fe
style D fill:#f3e5f5
style E fill:#e8f5e8
```

**图表来源**
- [service.ts:37-531](file://src/lib/billing/service.ts#L37-L531)
- [ledger.ts:105-281](file://src/lib/billing/ledger.ts#L105-L281)
- [reporting.ts:83-136](file://src/lib/billing/reporting.ts#L83-L136)

## 详细组件分析

### 成本计算引擎

成本计算引擎是UsageCost系统的核心逻辑处理器，负责不同类型API的定价策略：

#### 文本服务计价

文本服务采用基于token的计价模式：

```mermaid
flowchart TD
Start([开始文本计价]) --> InputCheck{检查输入参数}
InputCheck --> |有效| TokenCalc[计算输入输出token]
InputCheck --> |无效| Error[抛出错误]
TokenCalc --> PriceLookup[查找模型价格]
PriceLookup --> PriceFound{找到价格?}
PriceFound --> |是| CalcCost[计算费用]
PriceFound --> |否| CustomPrice{检查自定义价格}
CustomPrice --> |有| UseCustom[使用自定义价格]
CustomPrice --> |无| ThrowError[抛出未知模型错误]
UseCustom --> Markup[应用markup系数]
CalcCost --> Markup
Markup --> RoundMoney[四舍五入到分]
RoundMoney --> End([返回最终费用])
ThrowError --> Error
Error --> End
```

**图表来源**
- [cost.ts:420-435](file://src/lib/billing/cost.ts#L420-L435)
- [cost.ts:82-136](file://src/lib/billing/cost.ts#L82-L136)

#### 图像服务计价

图像服务支持固定价格和平面价格两种模式：

| 定价模式 | 特点 | 适用场景 |
|----------|------|----------|
| 固定价格 | 单价固定，不受分辨率影响 | 标准化生成服务 |
| 能力定价 | 基于分辨率等能力维度定价 | 高质量图像生成 |

#### 视频服务计价

视频服务是最复杂的计价模块，支持多种定价策略：

```mermaid
sequenceDiagram
participant Client as 客户端
participant Service as 计费服务
participant CostEngine as 成本引擎
participant Pricing as 定价目录
participant Ledger as 余额管理
Client->>Service : 请求视频计价
Service->>CostEngine : 解析输入参数
CostEngine->>Pricing : 查找内置价格
Pricing-->>CostEngine : 返回价格信息
CostEngine->>CostEngine : 应用能力验证
CostEngine->>CostEngine : 计算最终价格
CostEngine-->>Service : 返回计算结果
Service->>Ledger : 冻结相应金额
Ledger-->>Service : 确认冻结状态
Service-->>Client : 返回计费结果
```

**图表来源**
- [service.ts:380-531](file://src/lib/billing/service.ts#L380-L531)
- [cost.ts:548-698](file://src/lib/billing/cost.ts#L548-L698)

#### 语音服务计价

语音服务采用固定费率模式，按秒计费：

| 服务类型 | 默认模型 | 计价单位 | 特点 |
|----------|----------|----------|------|
| 语音合成 | index-tts2 | 秒 | 固定费率，支持批量折扣 |
| 语音设计 | bailian-voice-design | 次 | 固定费率，一次性收费 |
| 口型同步 | kling | 次 | 固定费率，高质量算法 |

**章节来源**
- [cost.ts:718-741](file://src/lib/billing/cost.ts#L718-L741)
- [service.ts:707-778](file://src/lib/billing/service.ts#L707-L778)

### 计费流程控制

计费系统支持三种运行模式，确保不同场景下的灵活部署：

```mermaid
stateDiagram-v2
[*] --> OFF : 关闭模式
[*] --> SHADOW : 影子模式
[*] --> ENFORCE : 强制模式
OFF --> OFF : 执行业务逻辑
SHADOW --> SHADOW : 记录影子使用
ENFORCE --> ENFORCE : 冻结余额并确认扣费
SHADOW --> ENFORCE : 切换到强制模式
ENFORCE --> SHADOW : 切换到影子模式
OFF --> ENFORCE : 启用强制计费
```

**图表来源**
- [service.ts:388-401](file://src/lib/billing/service.ts#L388-L401)

**章节来源**
- [service.ts:380-531](file://src/lib/billing/service.ts#L380-L531)

### 数据持久化策略

UsageCost的持久化采用事务性写入，确保数据一致性：

```mermaid
sequenceDiagram
participant Service as 计费服务
participant Ledger as 余额管理
participant DB as 数据库
participant UsageCost as UsageCost表
participant BalanceTx as BalanceTransaction表
Service->>Ledger : 开始事务
Ledger->>DB : 创建冻结记录
DB-->>Ledger : 返回冻结ID
Ledger->>DB : 确认冻结状态
DB-->>Ledger : 返回确认结果
Ledger->>DB : 创建UsageCost记录
DB-->>Ledger : 返回记录ID
Ledger->>DB : 创建BalanceTransaction记录
DB-->>Ledger : 返回交易ID
Ledger->>DB : 提交事务
DB-->>Service : 返回成功
```

**图表来源**
- [ledger.ts:191-281](file://src/lib/billing/ledger.ts#L191-L281)
- [reporting.ts:83-136](file://src/lib/billing/reporting.ts#L83-L136)

**章节来源**
- [ledger.ts:105-281](file://src/lib/billing/ledger.ts#L105-L281)
- [reporting.ts:83-136](file://src/lib/billing/reporting.ts#L83-L136)

## 依赖分析

计费系统的依赖关系体现了清晰的分层架构：

```mermaid
graph LR
subgraph "外部依赖"
A[Prisma ORM]
B[MySQL数据库]
C[Next.js框架]
end
subgraph "内部模块"
D[billing/cost]
E[billing/service]
F[billing/ledger]
G[billing/reporting]
H[billing/money]
end
subgraph "定价数据"
I[pricing目录]
J[标准定价文件]
end
A --> D
A --> E
A --> F
A --> G
A --> H
D --> I
I --> J
E --> D
E --> F
E --> G
F --> G
style D fill:#e3f2fd
style E fill:#f1f8e9
style F fill:#fff3e0
style G fill:#fce4ec
```

**图表来源**
- [schema.prisma:1-8](file://prisma/schema.prisma#L1-L8)
- [cost.ts:14-20](file://src/lib/billing/cost.ts#L14-L20)

**章节来源**
- [schema.prisma:1-8](file://prisma/schema.prisma#L1-L8)
- [cost.ts:14-20](file://src/lib/billing/cost.ts#L14-L20)

## 性能考虑

### 货币精度处理

系统采用高精度货币处理机制，避免浮点数运算误差：

- **存储精度**：Decimal(18,6)，支持最多18位数字，6位小数
- **计算精度**：内部使用6位小数精度进行计算
- **四舍五入**：统一采用银行家舍入法，确保计算准确性

### 查询优化策略

针对UsageCost的查询进行了专门优化：

| 查询类型 | 优化策略 | 性能收益 |
|----------|----------|----------|
| 项目总费用 | 使用聚合函数直接计算 | 减少数据传输量 |
| 成本明细查询 | 基于索引的分组查询 | 提高查询响应速度 |
| 最近记录查询 | 限制返回数量和排序优化 | 改善用户体验 |

### 缓存机制

系统实现了多层次缓存策略：

- **内存缓存**：热点数据缓存在内存中
- **数据库索引**：为常用查询字段建立索引
- **查询结果缓存**：对复杂报表查询结果进行缓存

## 故障排除指南

### 常见错误类型及解决方案

| 错误类型 | 错误代码 | 描述 | 解决方案 |
|----------|----------|------|----------|
| 余额不足 | INSUFFICIENT_BALANCE | 用户余额不足以支付费用 | 充值账户或调整使用量 |
| 冻结状态异常 | BILLING_FREEZE_NOT_PENDING | 冻结记录状态不是pending | 检查冻结流程或联系技术支持 |
| 重复计费 | BILLING_IDEMPOTENT_ALREADY_CONFIRMED | 重复的计费请求 | 检查幂等性键或等待处理完成 |
| 未知模型 | BILLING_UNKNOWN_MODEL | 不支持的模型标识 | 更新模型配置或使用受支持的模型 |

### 调试工具和方法

系统提供了完善的调试和监控功能：

```mermaid
flowchart TD
DebugStart[开始调试] --> LogCheck[检查日志]
LogCheck --> ErrorTrace[错误追踪]
ErrorTrace --> DataVerify[数据验证]
DataVerify --> FixApply[修复应用]
FixApply --> TestVerify[测试验证]
TestVerify --> DebugEnd[调试完成]
LogCheck --> |发现错误| ErrorTrace
ErrorTrace --> |定位问题| DataVerify
DataVerify --> |确认修复| FixApply
FixApply --> |回归测试| TestVerify
```

**图表来源**
- [service.ts:780-793](file://src/lib/billing/service.ts#L780-L793)

**章节来源**
- [service.ts:780-793](file://src/lib/billing/service.ts#L780-L793)

## 结论

UsageCost使用成本模型通过精心设计的架构和实现，为Waoowaoo平台提供了强大而灵活的计费能力。该模型的主要优势包括：

1. **统一性**：所有计费操作都通过UsageCost实体进行，确保数据一致性和可追溯性
2. **灵活性**：支持多种计价模式和自定义定价策略，适应不同的业务需求
3. **准确性**：精确的货币处理和严格的错误控制机制
4. **可扩展性**：模块化的架构设计便于功能扩展和维护

通过合理的成本管理和最佳实践，UsageCost模型能够有效支撑Waoowaoo平台的商业化运营，为用户提供透明、准确的计费体验。

## 附录

### API类型和计费规则对照表

| API类型 | 计费单位 | 计费策略 | 典型应用场景 |
|---------|----------|----------|--------------|
| text | token | 基于token的输入输出分别计费 | 文本生成、对话系统 |
| image | image | 固定价格或能力定价 | 图像生成、编辑 |
| video | video | 能力定价（分辨率、时长、音频） | 视频生成、合成 |
| voice | second | 按时长计费 | 语音合成 |
| voice-design | call | 固定费用 | 音色定制 |
| lip-sync | call | 固定费用 | 口型同步 |

### 成本管理最佳实践

1. **预算控制**：设置合理的月度预算和预警机制
2. **使用监控**：定期检查各API类型的使用情况
3. **成本优化**：选择合适的模型和参数以降低成本
4. **审计跟踪**：保留完整的计费记录用于财务审计