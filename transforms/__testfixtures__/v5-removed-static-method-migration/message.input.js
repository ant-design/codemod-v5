import { message } from 'antd';

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const msg = message.useMessage();
  const [msgApi] = msg;
  const onClick1 = () => {
    message.warn();
  }
  const onClick2 = () => {
    messageApi.warn();
  };
  const onClick3 = () => {
    msg[0].warn();
  };
  const onClick4 = () => {
    msgApi.warn();
  };
  return <>{contextHolder}</>;
};
