import { getContainers } from '../../../../provider-utils/awscloudformation/docker-compose/converter';

describe('getContainers', () => {
  const containers = yaml => getContainers(yaml).containers;
  describe('containers', () => {
    it('returns 0 container if not exist containers in services', () => {
      const yaml = `
      version: "3.8"
      services: []
      `;
      expect(containers(yaml).length).toEqual(0);
    });
    it('returns containers if exist containers in services', () => {
      const yaml = `
      version: "3.8"
      services:
        app: []
        web: []
      `;
      expect(containers(yaml).length).toEqual(2);
    });

    describe('container', () => {
      it('containers[].name is services.key', () => {
        const yaml = `
        version: "3.8"
        services:
          app: []
          web: []
        `;
        expect(containers(yaml)[0].name).toMatch(/app/);
        expect(containers(yaml)[1].name).toMatch(/web/);
      });
      it('containers[].name is container_name if container has container_name', () => {
        const yaml = `
        version: "3.8"
        services:
          app: 
            container_name: 'awesome_app'
          web:
            container_name: 'awesome_web'
        `;
        expect(containers(yaml)[0].name).toMatch(/awesome_app/);
        expect(containers(yaml)[1].name).toMatch(/awesome_web/);
      });
    });
  });
});
