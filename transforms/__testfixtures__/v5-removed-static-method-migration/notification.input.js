import { notification } from 'antd';

const App = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const notice = notification.useNotification();
  const [noticeApi] = notice;
  const onClick1 = () => {
    notification.close();
  }
  const onClick2 = () => {
    notificationApi.close();
  };
  const onClick3 = () => {
    notice[0].close();
  };
  const onClick4 = () => {
    noticeApi.close();
  };
  return <>{contextHolder}</>;
};
