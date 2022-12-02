import { message } from 'antd';

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const msg = message.useMessage();
  const [msgApi] = msg;
  const onClick1 = () => {
    message.warning();
  }
  const onClick2 = () => {
    messageApi.warning();
  };
  const onClick3 = () => {
    msg[0].warning();
  };
  const onClick4 = () => {
    msgApi.warning();
  };
  return <>{contextHolder}</>;
};
