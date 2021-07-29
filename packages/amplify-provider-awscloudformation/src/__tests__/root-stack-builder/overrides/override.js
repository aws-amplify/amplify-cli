function overrideProps(props) {
  props.authRole.roleName = 'randomrole';
  props.addCfnParameter(
    {
      type: 'String',
      description: 'nkjdsncksndc',
      default: 'cjsncksdncks',
    },
    'random',
  );
  return props;
}

module.exports = { overrideProps };
