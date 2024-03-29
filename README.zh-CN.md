[English](./README.md) | 简体中文

# Ant Design 5 Codemod

一组帮助你升级到 antd 5 的 codemod 脚本集合，基于 [jscodeshift](https://github.com/facebook/jscodeshift) 和 and [postcss](https://github.com/postcss/postcss) 构建。(受 [react-codemod](https://github.com/reactjs/react-codemod) 启发)

[![NPM version](https://img.shields.io/npm/v/@ant-design/codemod-v5.svg?style=flat)](https://npmjs.org/package/@ant-design/codemod-v5) [![NPM downloads](http://img.shields.io/npm/dm/@ant-design/codemod-v5.svg?style=flat)](https://npmjs.org/package/@ant-design/codemod-v5) [![Github Action](https://github.com/ant-design/codemod-v5/actions/workflows/test.yml/badge.svg)](https://github.com/ant-design/codemod-v5/actions/workflows/test.yml)

## 使用

在运行 codemod 脚本前，请先提交你的本地代码修改。

```shell
# 使用 npx 直接运行
npx -p @ant-design/codemod-v5 antd5-codemod src
# 或者使用 pnpm 直接运行
pnpm --package=@ant-design/codemod-v5 dlx antd5-codemod src
```

## Codemod 脚本包括:

#### `v5-removed-component-migration`

Replace import for removed component in v5.

- 将 `Comment` 改为从 `@ant-design/compatible` import.
- 将 `PageHeader` 改为从 `@ant-design/pro-layout` import.
- 从 `FloatButton.BackTop` 组件中导入并使用 `BackTop`.

```diff
- import { Avatar, BackTop, Comment, PageHeader } from 'antd';
+ import { Comment } from '@ant-design/compatible';
+ import { PageHeader } from '@ant-design/pro-layout';
+ import { Avatar, FloatButton } from 'antd';

  ReactDOM.render( (
    <div>
      <PageHeader
        className="site-page-header"
        onBack={() => null}
        title="Title"
        subTitle="This is a subtitle"
      />
      <Comment
        actions={actions}
        author={<a>Han Solo</a>}
        avatar={<Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />}
        content={
          <p>
            We supply a series of design principles, practical patterns and high quality design
            resources (Sketch and Axure), to help people create their product prototypes beautifully
            and efficiently.
          </p>
        }
        datetime={
          <span title="2016-11-22 11:22:33">8 hours ago</span>
        }
      />
-     <BackTop />
+     <FloatButton.BackTop />
    </div>
  );
```

#### `v5-props-changed-migration`

将 v4 中部分 props 用法迁移到 v5 版本.

```diff
import { Tag, Modal, Slider } from 'antd';

const App = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
-     <Tag
-       visible={visible}
-     />
+     {visible ? <Tag /> : null}
      <Modal
-       visible={visible}
+       open={visible}
      />
-     <Slider tooltipVisible={visible} tooltipPlacement="bottomLeft" />
+     <Slider tooltip={{ placement: "bottomLeft", open: visible }} />
    </>
  );
};
```

#### `v5-removed-static-method-migration`

* 替换 `message.warn` 为 `message.warning`。
* 替换 `notification.close` 为 `notification.destroy`。

```diff
import { message, notification } from 'antd';

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const onClick1 = () => {
-   message.warn();
+   message.warning();
  }
  const onClick2 = () => {
-   messageApi.warn();
+   messageApi.warning();
  };

  const [notificationApi] = notification.useNotification();
  const onClick3 = () => {
-   notification.close();
+   notification.destroy();
  }
  const onClick4 = () => {
-   notificationApi.close();
+   notificationApi.destroy();
  };

  return <>{contextHolder}</>;
};
```

#### `v5-remove-style-import`

注释掉 js 文件中的 antd 样式文件导入。

```diff
- import 'antd/es/auto-complete/style';
- import 'antd/lib/button/style/index.less';
- import 'antd/dist/antd.compact.min.css';
+ // import 'antd/es/auto-complete/style';
+ // import 'antd/lib/button/style/index.less';
+ // import 'antd/dist/antd.compact.min.css';
```

#### `Remove Antd Less` in less file

注释掉 less 文件中的 antd 样式文件导入。

```diff
- @import (reference) '~antd/dist/antd.less';
- @import '~antd/es/button/style/index.less';
+ /* @import (reference) '~antd/dist/antd.less'; */
+ /* @import '~antd/es/button/style/index.less'; */
@import './styles.less';

body {
  font-size: 14px;
}
```

## Development

```bash
  npm run release
  npm publish
```

## License

MIT
