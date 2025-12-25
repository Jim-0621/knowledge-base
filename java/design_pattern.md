# 设计模式

## SOLID原则



- **单一职责原则 Single Responsibility Principle**：就一个类而言，应该仅有一个引起它变化的原因
- **开闭原则 Open Closed Principle**：对扩展开放，对修改关闭
- **里氏替换原则 Liskov Substitution Principle**：子类可以扩展父类的功能，但不能改变父类原有的功能
- **接口隔离原则 Interface Segregation Principle**：客户端不应该依赖那些它不需要的接口
- **依赖倒置原则 Dependency Inversion Principle**：抽象不应该依赖于细节，细节应该依赖于抽象



## 分类

23 种设计模式可以分为三大类：

- **创建型模式**：用于创建对象的模式，同时隐藏对象创建的逻辑，避免代码中出现大量 new 操作和复杂的创建逻辑。
  - **单例模式**（Singleton）：确保一个类只有一个实例，并提供一个全局访问点。
  - 工厂方法模式（Factory Method）：定义一个接口用于创建对象，但让子类决定实例化哪一个类
  - 抽象工厂模式（Abstract Factory）：提供一个接口以创建一系列相关或相互依赖的对象，而无需指定具体类
  - 建造者模式（Builder）：将复杂对象的构建过程与它的表示分离，使得同样的构建过程可以创建不同的表示
  - 原型模式（Prototype）：通过复制已有的实例来创建新对象，避免直接实例化类。
  
- **结构型模式**：用于处理对象组合的结构，关注类与对象的组合。
  - 适配器模式（Adapter）：将一个类的接口转换为客户端希望的另一个接口，使原本接口不兼容的类能够一起工作。
  - 桥接模式（Bridge）：将抽象部分与它的实现部分分离，使它们可以独立地变化。
  - 组合模式（Composite）：将对象组合成树形结构以表示“整体-部分”的层次结构，使得客户端可以以统一的方式处理单个对象和对象的组合
  - 装饰者模式（Decorator）：动态地给对象添加新的职责，提供比继承更灵活的功能扩展方式。
  - 外观模式（Facade）：为子系统中的一组接口提供一个统一的接口，简化系统的使用
  - 享元模式（Flyweight）：通过共享尽可能多的相似对象来节省内存。
  - 代理模式（Proxy）：为其他对象提供一个代理以控制对这个对象的访问。
  
- **行为型模式**：用于定义对象如何相互协作以完成单个对象无法单独实现的任务。
  - 责任链模式（Chain of Responsibility）：将请求沿着处理者链传递，直到有一个处理者处理它。

  - 命令模式（Command）：将请求封装成对象，以便使用不同的请求、队列或日志进行参数化。

  - 解释器模式（Interpreter）：为语言创建解释器，定义语言的文法，并构建解释该语言的解释器。

  - 迭代器模式（Iterator）：提供一种方法顺序访问聚合对象中的元素，而不暴露其内部表示。

  - 中介者模式（Mediator）：用一个中介对象封装一系列对象的交互，中介者使各对象不需要显示地相互引用。

  - 备忘录模式（Memento）：在不破坏封装的前提下，捕获并外部化一个对象的内部状态，以便在以后恢复它。

  - 观察者模式（Observer）：定义对象间的一对多依赖，当一个对象改变状态时，所有依赖它的对象都会收到通知并自动更新。

  - 状态模式（State）：允许对象在其内部状态改变时改变其行为。

  - **策略模式**（Strategy）：定义一系列算法，将每个算法封装起来，并使它们可以互换使用。

  - 模板方法模式（Template Method）：在父类中定义算法的骨架，并允许子类在不改变算法结构的前提下重写算法的某些步骤。

  - 访问者模式（Visitor）：为一个对象结构中的元素添加新功能，不改变各元素的类。




## 创建型模式



### 单例模式



**核心思想**： 保证⼀个类只有⼀个实例，并提供⼀个全局访问点来访问这个实 例。

**必须遵循的规则**： 

- 私有的构造函数：防⽌外部代码直接创建类的实例

- 私有的静态实例变量：保存该类的唯⼀实例

- 公有的静态⽅法：通过公有的静态⽅法来获取类的实例



**实现方式**： 懒汉式、饿汉式



饿汉式：在类加载时就已经完成了实例的创建（线程安全）

``` java
public class Singleton {
    private static final Singleton instance = new Singleton();
    
    private Singleton() {
    	// 私有构造⽅法，防⽌外部实例化
    }
    
    public static Singleton getInstance() {
    	return instance;
    }
}
```

饿汉模式 多了一个 final，主要是为了保证在多线程中 instance 实例 初始化完毕。



懒汉模式：第⼀次使⽤时才创建（线程不安全）

``` java
public class Singleton {
    private static Singleton instance;
    
    private Singleton() {
    	// 私有构造⽅法，防⽌外部实例化
    }
    
    // 使⽤了同步关键字来确保线程安全, 可能会影响性能
    public static synchronized Singleton getInstance() {
    	if (instance == null) {
    		instance = new Singleton();
    	}
    	return instance;
    }
}
```

在懒汉模式的基础上，可以使⽤双重检查锁来提⾼性能。

**提高性能** 体现在：在第一次检查时，如果实例已经存在，则直接返回实例，无需进入同步代码块，从而避免了每次调用都进行同步的性能开销。

``` java
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() {
        // 私有构造方法，防止外部实例化
    }
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```



### 工厂方法模式



**简单工厂模式** 只有一个工厂类，负责创建所有产品，如果要添加新的产品，通常需要修改工厂类的代码（不是设计模式）

**工厂方法模式** 引入了抽象工厂和具体工厂的概念，**每个具体工厂只负责创建一个具体产品**，添加新的产品只需要添加新的工厂类而无需修改原来的代码，这样就使得产品的生产更加灵活，支持扩展，符合开闭原则。



工厂方法模式分为以下几个角色：

- 抽象工厂：一个接口，包含一个抽象的工厂方法（用于创建产品对象）。
- 具体工厂：实现抽象工厂接口，创建具体的产品。
- 抽象产品：定义产品的接口。
- 具体产品：实现抽象产品接口，是工厂创建的对象.



``` java
// 抽象产品
interface Shape {
    void draw();
}

// 具体产品 - 圆形
class Circle implements Shape {
    @Override
    public void draw() {
        System.out.println("Circle");
    }
}

// 具体产品 - 正方形
class Square implements Shape {
    @Override
    public void draw() {
        System.out.println("Square");
    }
}

// 抽象工厂
interface ShapeFactory {
    Shape createShape();
}

// 具体工厂 - 创建圆形
class CircleFactory implements ShapeFactory {
    @Override
    public Shape createShape() {
        return new Circle();
    }
}

// 具体工厂 - 创建正方形
class SquareFactory implements ShapeFactory {
    @Override
    public Shape createShape() {
        return new Square();
    }
}

// 客户端代码
public class Client {
    public static void main(String[] args) {
        ShapeFactory circleFactory = new CircleFactory();
        Shape circle = circleFactory.createShape();
        circle.draw();  // 输出：Circle

        ShapeFactory squareFactory = new SquareFactory();
        Shape square = squareFactory.createShape();
        square.draw();  // 输出：Square
    }
}
```



### 抽象工厂模式



**工厂方法模式**：每个具体工厂负责创建 **一个** 产品

**抽象工厂模式**：每个具体工厂负责创建 **一类** 产品



``` java
// 1. 定义抽象产品
// 抽象产品A
interface ProductA {
    void display();
}

// 抽象产品B
interface ProductB {
    void show();
}

// 2. 实现具体产品类 
// 具体产品A1
class ConcreteProductA1 implements ProductA {
    @Override
    public void display() {
        System.out.println("Concrete Product A1");
    }
}

// 具体产品A2
class ConcreteProductA2 implements ProductA {
    @Override
    public void display() {
        System.out.println("Concrete Product A2");
    }
}

// 具体产品B1
class ConcreteProductB1 implements ProductB {
    @Override
    public void show() {
        System.out.println("Concrete Product B1");
    }
}

// 具体产品B2
class ConcreteProductB2 implements ProductB {
    @Override
    public void show() {
        System.out.println("Concrete Product B2");
    }
}

// 3. 定义抽象工厂接口
interface AbstractFactory {
    ProductA createProductA();
    ProductB createProductB();
}
// 4. 实现具体工厂类
// 具体工厂1，生产产品A1和B1
class ConcreteFactory1 implements AbstractFactory {
    @Override
    public ProductA createProductA() {
        return new ConcreteProductA1();
    }

    @Override
    public ProductB createProductB() {
        return new ConcreteProductB1();
    }
}

// 具体工厂2,生产产品A2和B2
class ConcreteFactory2 implements AbstractFactory {
    @Override
    public ProductA createProductA() {
        return new ConcreteProductA2();
    }

    @Override
    public ProductB createProductB() {
        return new ConcreteProductB2();
    }
}

// 客户端代码
public class AbstractFactoryExample {
    public static void main(String[] args) {
        // 使用工厂1创建产品A1和产品B1
        AbstractFactory factory1 = new ConcreteFactory1();
        ProductA productA1 = factory1.createProductA();
        ProductB productB1 = factory1.createProductB();
        productA1.display();
        productB1.show();

        // 使用工厂2创建产品A2和产品B2
        AbstractFactory factory2 = new ConcreteFactory2();
        ProductA productA2 = factory2.createProductA();
        ProductB productB2 = factory2.createProductB();
        productA2.display();
        productB2.show();
    }
}
```



### 简单工厂、工厂方法、抽象工厂的区别



- 简单工厂模式：一个工厂方法创建**所有**具体产品
- 工厂方法模式：一个工厂方法创建**一个**具体产品
- 抽象工厂模式：一个工厂方法创建**一类**具体产品



## 行为型模式



### 责任链模式



**责任链模式是一种行为设计模式， 允许你将请求沿着处理者链进行发送**。收到请求后， 每个处理者均可对请求进行处理， 或将其传递给链上的下个处理者。



**使用场景**： 

- 多条件流程判断：权限控制
- ERP 系统流程审批：总经理、人事经理、项目经理
- Java 过滤器的底层实现 Filter

**反例**： 

假设现在有一个闯关游戏，进入下一关的条件是上一关的分数要高于 xx.

``` java
if(第1关通过){
    // 第2关 游戏
    if(第2关通过){
        // 第3关 游戏
        if(第3关通过){
           // 第4关 游戏
            if(第4关通过){
                // 第5关 游戏
                if(第5关通过){
                    // 第6关 游戏
                    if(第6关通过){
                        //...
                    }
                }
            } 
        }
    }
}
```

这种代码不仅冗余，并且当我们要将某两关进行调整时会对代码非常大的改动，这种操作的风险很高。



**三个核心角色**： 

- **抽象处理者（Handler）角色**： 定义一个处理请求的接口，包含抽象处理方法和一个后继连接。
- **具体处理者（Concrete Handler）角色**： 实现抽象处理者的处理方法，判断能否处理本次请求，如果可以处理请求则处理，否则将该请求转给它的后继者。
- **客户类（Client）角色**： 创建处理链，并向链头的具体处理者对象提交请求，它不关心处理细节和请求的传递过程。





### 策略模式



**策略模式属于行为型模式，允许我们定义一系列算法，并将其封装在独立的策略类中，使得它们可以互相替换**。通过使用策略模式，我们能够灵活地选择和切换不同的算法，而无需修改原有的代码，**替代⼤量 if else 的逻辑**。



**使用场景**： 

- **支付方式选择**：一个电子商务平台可以根据用户的选择来使用不同的支付策略，例如信用卡支付、支付宝支付、微信支付等。
- **排序算法选择**：一个排序工具可以根据用户的需求选择不同的排序算法，例如快速排序、归并排序等。
- **数据验证**：一个表单验证工具可以根据不同的验证规则采用不同的验证策略，例如长度验证、格式验证等。



**三个核心角色**： 

- **策略接口（Strategy）**：定义了一组算法或行为的公共接口，所有具体策略都必须实现该接口。
- **具体策略类（Concrete Strategy）**：实现了策略接口，提供了具体的算法或行为。
- **上下文（Context）**：封装了具体策略的执行逻辑，提供给客户端使用的接口。上下文通常包含一个指向策略接口的引用，用于调用具体策略的方法。





### 状态模式



在没有状态模式的情况下，为了添加新的状态或修改现有的状态，往往需要修改已有的代码，这违背了开闭原则，而且如果对象的状态切换逻辑和各个状态的 ⾏为都在同⼀个类中实现，就可能导致该类的职责过重，不符合单⼀职责原则。



状态模式将每个状态的⾏为封装在一个具体状态类中，使得每个状态类相对独立，并将对象在不同状态下的⾏为进⾏委托，从而使得对象的状态可以在运⾏时动态改变，每个状态的实现也不会影响其他状态。



**三个核心角色**： 

- State （状态）： 定义⼀个接⼝，用于封装与 Context 的⼀个特定状态相关的⾏为。 
- ConcreteState （具体状态）： 负责处理 Context 在状态改变时的⾏为, 每一个具体状态子类实现⼀个 与 Context 的⼀个状态相关的⾏为。
- Context （上下⽂）: 维护⼀个具体状态⼦类的实例，这个实例定义当前的状态。



### 模板方法模式



模板方法模式定义了一个算法的骨架，将一些步骤的实现延迟到子类。模板⽅法模式使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。



核心角色：

- 模板类 AbstractClass ：由一个模板⽅法和若干个基本方法构成，模板⽅法定义了逻辑的骨架，按照顺序调用包含的基本⽅法，**基本方法通常是一些抽象⽅法，这些⽅法由子类去实现**。基本方法还包含⼀些具体⽅法， 它们是算法的⼀部分但已经有默认实现，在具体子类中可以继承或者重写。 

- 具体类 ConcreteClass ：继承自模板类，实现了在模板类中定义的抽象⽅法，以完成算法中特定步骤的具体 实现。


## 参考资料

1. [卡码网设计模式精讲](https://github.com/youngyangyang04/kama-DesignPattern?tab=readme-ov-file)