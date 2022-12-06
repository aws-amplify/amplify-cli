import { useState } from "react";
import { Button, Modal } from "semantic-ui-react";

type Props = {
  onClose: Function;
  onClear: Function;
};
export function ClearDataModal(props: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const actionText = "Clear";
  const cancelText = "Cancel";
  const confirmationText = "Do you want to clear the data of your mock server?";

  const handleClose = () => {
    setIsOpen(false);
    props.onClose();
  };
  const handleReset = () => {
    setIsOpen(false);
    props.onClear();
    props.onClose();
  };
  return (
    <Modal onClose={handleClose} open={isOpen}>
      <Modal.Header>Reset </Modal.Header>
      <Modal.Content>
        <Modal.Description> {confirmationText} </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button primary onClick={handleReset}>
          {actionText}
        </Button>
        <Button color="red" onClick={handleClose}>
          {cancelText}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
