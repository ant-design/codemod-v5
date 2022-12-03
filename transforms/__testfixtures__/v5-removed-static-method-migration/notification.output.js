import { notification } from 'antd';

const App = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const notice = notification.useNotification();
  const [noticeApi] = notice;
  const onClick1 = () => {
    notification.destroy();
  }
  const onClick2 = () => {
    notificationApi.destroy();
  };
  const onClick3 = () => {
    notice[0].destroy();
  };
  const onClick4 = () => {
    noticeApi.destroy();
  };
  return <>{contextHolder}</>;
};
