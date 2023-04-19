import { Drawer, Tag, Modal, Slider } from 'antd';

const App = () => {
  const [visible, setVisible] = useState(false);

  return (<>
    {visible ? <Tag /> : null}
    <Tag />
    <Modal
      open={visible}
    />
    <Slider
      tooltip={{
        placement: "bottomLeft",
        open: true
      }} />
  </>);
};

const App1 = () => {
  const [visible, setVisible] = useState(false);

  return visible ? (<Tag />) : null;
};

const App2 = () => {
  return (<Tag />);
};

const App3 = () => {
  return (
    (<Drawer
      title="Basic Drawer"
      placement="right"
      onClose={onClose}
      open={open}
    >
      <div className="div1">Some contents...</div>
      <div style={{ display: 'block' }}>Some contents...</div>
    </Drawer>)
  );
}
