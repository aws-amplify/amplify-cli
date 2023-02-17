import { useState } from 'react';
import { Button, Modal } from 'semantic-ui-react';

type Props = {
  onClose: Function; // Used to close the modal when the user clicks on the cancel button
  onClear: Function; // Used to clear the data when the user clicks on the clear button
};
export function ClearDataModal(props: Props) {
  const [isOpen, setIsOpen] = useState(true);

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
        <Modal.Description> {'Do you want to clear the data of your mock server?'} </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button primary onClick={handleReset}>
          {'Clear'}
        </Button>
        <Button color="red" onClick={handleClose}>
          {'Cancel'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
