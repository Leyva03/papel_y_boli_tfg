import { mount } from '@vue/test-utils';
import BasePage from '@/components/base/BasePage.vue';

describe('BasePage.vue', () => {
  it('debería renderizar el título proporcionado correctamente', () => {
    const titleText = 'Mi Título de Prueba';
    const wrapper = mount(BasePage, {
      props: {
        title: titleText,
      },
    });
    const h1 = wrapper.find('h1.titulo-inicio');
    expect(h1.exists()).toBe(true);
    expect(h1.text()).toBe(titleText);
  });

  it('debería renderizar el contenido del slot por defecto', () => {
    const slotContent = '<p>Este es el contenido del slot.</p>';
    const wrapper = mount(BasePage, {
      props: {
        title: 'Título con Slot',
      },
      slots: {
        default: slotContent,
      },
    });
    expect(wrapper.html()).toContain(slotContent);
    expect(wrapper.find('p').text()).toBe('Este es el contenido del slot.');
  });

  it('debería coincidir con el snapshot con título y contenido de slot', () => {
    const titleText = 'Título para Snapshot';
    const slotContent = '<div>Contenido del slot para snapshot</div>';
    const wrapper = mount(BasePage, {
      props: {
        title: titleText,
      },
      slots: {
        default: slotContent,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('debería coincidir con el snapshot solo con el título (sin slot)', () => {
    const titleText = 'Título Solo para Snapshot';
    const wrapper = mount(BasePage, {
      props: {
        title: titleText,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});