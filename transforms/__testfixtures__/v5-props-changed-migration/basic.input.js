import { Drawer, Tag, Modal, Slider } from 'antd';

const App = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Tag
        visible={visible}
      />
      <Tag
        visible
      />
      <Modal
        visible={visible}
      />
      <Slider tooltipVisible={true} tooltipPlacement="bottomLeft" />
    </>
  );
};

const App1 = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Tag
      visible={visible}
    />
  );
};

const App2 = () => {
  return (
    <Tag
      visible
    />
  );
};

const App3 = () => {
  return (
    <Drawer
      title="Basic Drawer"
      placement="right"
      onClose={onClose}
      visible={open}
    >
      <div className="div1">Some contents...</div>
      <div style={{ display: 'block' }}>Some contents...</div>
    </Drawer>
  );
}
