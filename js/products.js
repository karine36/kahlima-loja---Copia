window.KahLimaCategories = [
  { id: 'tecnologia', name: 'Tecnologia', icon: '⌘' },
  { id: 'saude', name: 'Saúde', icon: '+' },
  { id: 'ferramenta', name: 'Ferramentas', icon: '▣' },
  { id: 'beleza', name: 'Beleza', icon: '✳' },
  { id: 'casa', name: 'Casa', icon: '⌂' },
  { id: 'outros', name: 'Outros', icon: '◇' },
];

window.KahLimaProductOptions = {
  color: ['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Rosa', 'Roxo', 'Laranja', 'Cinza'],
  type: ['Padrão'],
};

// Omitir options usa as opções padrão; [] remove essa opção apenas do produto.
window.getKahLimaProductOptions = (product) => ({
  color: product.options?.color ?? window.KahLimaProductOptions.color,
  type: product.options?.type ?? window.KahLimaProductOptions.type,
});

window.KahLimaProducts = [
  {
    id: 'AU-101',
    name: 'Power Bank Portátil 20.000mAh',
    description: 'Carregamento rápido de 22,5 W e visor LCD de bateria',
    price: 119.99,
    // Edite as quantidades de cada cor; o estoque total é calculado pela soma.
    stockByColor: {
      Preto: 6,
      Branco: 1,
    },
    category: 'Tecnologia',
    categoryId: 'tecnologia',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    details: 'Leve energia extra para o celular, tablet e outros dispositivos durante o dia. A capacidade de 20.000 mAh e a potência de até 22,5 W ajudam a recarregar seus aparelhos com praticidade. O visor LCD mostra o nível de bateria, e as conexões USB-C, Micro USB e Lightning ampliam a compatibilidade.',
    images: [
      'img/produto1/Produto1.jpeg',
      'img/produto1/Produto__1.jpeg',
      'img/produto1/produto112.jpeg',

    ],
  },
  {
    id: 'AU-208',
    name: 'Kit de Costura Portátil Completo',
    description: 'Estojo organizado com linhas coloridas e acessórios essenciais',
    price: 25,
    stock: 3,
    category: 'Ferramentas',
    categoryId: 'ferramenta',
    color: 'sage',
    shape: 'book',
    isNew: true,
    details: 'Tenha o essencial para pequenos reparos e projetos de costura sempre à mão. O estojo compacto com fechamento em zíper organiza linhas coloridas, tesoura, agulhas, fita métrica, dedal e outros acessórios. Prático para guardar em casa ou levar em viagens.',
    // Use [] para não exibir uma opção; informe valores, por exemplo ['Azul', 'Preto'], para habilitá-la.
    options: {
      color: [],
      type: [],
    },
    images: [
      'img/produto2/produto2.jpeg',
      'img/produto2/produto22.jpeg',
      'img/produto2/produtos222.jpeg',
    ],
  },
  {
    id: 'AU-315',
    name: 'Acendedor Elétrico Recarregável',
    description: 'Acendimento prático com envio em cor sortida',
    price: 24.9,
    stock: 5,
    category: 'Casa',
    categoryId: 'casa',
    color: 'rose',
    shape: 'vase',
    isNew: true,
    details: 'Acendedor elétrico recarregável para facilitar o acendimento no dia a dia. O produto é enviado em cor sortida, conforme disponibilidade. Recarregue antes do uso e siga as instruções e recomendações de segurança do fabricante.',
    
    options: {
      color: [],
      type: [],
    },

    images: [
      'img/produtos3/produto3.jpeg',
      'img/produtos3/produto33.jpeg',
      'img/produtos3/produto333.jpeg',
    ],
  },
   {
    id: 'KL-577',
    name: 'Alicate com botões ',
    description: 'Ferramenta prática para pequenos reparos e projetos manuais',
    details: 'alicate com botões para pequenos reparos e projetos manuais. O design ergonômico facilita o manuseio, e a construção resistente garante durabilidade. Utilize a ferramenta de acordo com as instruções do fabricante e mantenha fora do alcance de crianças.',
    options: {
      color: [],
      type: [],
    },
    price: 20.0,
    stock: 1,
    category: 'Ferramentas',
    categoryId: 'ferramenta',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [ 
      'img/produtos4/produto4.jpeg',
      'img/produtos4/produto44.jpeg',
      'img/produtos4/produto444.jpeg',
    ],
  },
  {
    id: 'AU-427',
    name: 'Kit com 48 Canetas de Ponta Dupla',
    description: 'Cores variadas para lettering, desenho e ilustração',
    price: 39.9,
    stock: 1,
    category: 'Papelaria',
    categoryId: 'outros',
    color: 'sand',
    shape: 'bag',
    isNew: true,
    details: 'Kit com 48 canetas de ponta dupla para desenhos, lettering, anotações coloridas e atividades criativas. A variedade de cores ajuda a destacar ideias e criar diferentes combinações. Guarde as canetas tampadas após o uso.',
    options: {
      color: [],
      type: [],
    },
    images: [
      'img/produtos5/produto5.jpg',
      'img/produtos5/produto55.jpg',
      'img/produtos5/produto555.jpg',
    ],
  },
  {
    id: 'KL-501',
    name: 'Turbina Portátil para Lavagem',
    description: 'Auxílio compacto para lavar peças pequenas',
    details: 'Turbina portátil para auxiliar na lavagem de peças pequenas. Compacta e prática para usar em situações em que uma lavagem localizada é suficiente. Confira as instruções do fabricante quanto à instalação, alimentação e uso adequado.',
    options: {
      color: [],
      type: [],
    },
    price: 17,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'sage',
    shape: 'vase',
    isNew: true,
    images: [
      'img/produtos6/produto6.jpg',
      'img/produtos6/produto66.jpg',
      'img/produtos6/produto666.jpg'
    ],
  },
  {
    id: 'KL-502',
    name: 'Extensão Filtro de Linha Coibeu',
    description: 'Extensão elétrica branca para organizar suas conexões',
    details: 'Extensão com filtro de linha na cor branca para conectar e organizar aparelhos em um só ponto. Antes de usar, confira a tensão, a potência máxima suportada e as instruções impressas pelo fabricante. Não exceda os limites indicados.',
    options: {
      color: [],
      type: [],
    },
    price: 46.35,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'bag',
    isNew: true,
    images: [
      'img/produtos7/produto7.jpg',
      'img/produtos7/produto77.jpg',
      'img/produtos7/produto777.jpg'
    ],
  },
  {
    id: 'KL-503',
    name: 'Kit de Bolso com 24 Ferramentas',
    description: 'Conjunto compacto para pequenos reparos',
    details: 'Conjunto compacto com 24 ferramentas para pequenos ajustes e reparos do dia a dia. O estojo facilita guardar e transportar as peças. Confira os componentes inclusos e utilize cada ferramenta de acordo com sua finalidade.',
    options: {
      color: [],
      type: [],
    },
    price: 25,
    stock: 1,
    category: 'Ferramentas',
    categoryId: 'ferramenta',
    color: 'rose',
    shape: 'book',
    isNew: true,
    images: [
      'img/produtos8/produto8.jpg',
      'img/produtos8/produto88.jpg',
      'img/produtos8/produto888.jpg'
    ],
  },
  {
    id: 'KL-504',
    name: 'Fita LED 2835 3000K 12V',
    description: 'Iluminação branco quente · 60 LEDs · 10 W por metro',
    details: 'Fita LED modelo 2835 com luz branco quente de 3000 K, especificação de 60 LEDs e consumo de 10 W por metro, projetada para alimentação em 12 V. A fonte não está incluída, salvo indicação diferente do anúncio. Confirme a tensão e a potência antes da instalação.',
    options: {
      color: [],
      type: [],
    },
    price: 19.9,
    stock: 1,
    category: 'Decoração',
    categoryId: 'outros',
    color: 'sand',
    shape: 'vase',
    isNew: true,
    images: [
      'img/produtos9/produto9.jpg',
      'img/produtos9/produto99.jpg',
      'img/produtos9/produto999.jpg'
    ],
  },
  {
    id: 'KL-505',
    name: 'Papa-Bolinhas Elétrico Recarregável',
    description: 'Ajuda a remover bolinhas de roupas e tecidos',
    details: 'Aparelho elétrico recarregável para ajudar a retirar bolinhas de roupas e tecidos, renovando a aparência das peças. Use sobre uma superfície plana, sem pressionar, e siga as orientações do fabricante para limpeza e recarga. Cor verde.',
    options: {
      color: [],
      type: [],
    },
    price: 26.5,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos10/produto10.jpg',
      'img/produtos10/produto1010.jpg',
      'img/produtos10/produto101010.jpg'
    ],
  },

  {
    id: 'KL-507',
    name: 'Sensor de Presença',
    description: 'Acionamento automático por detecção de movimento',
    details: 'Sensor de presença para automatizar o acionamento de iluminação ou de equipamentos compatíveis quando detecta movimento. Verifique alcance, tensão, tipo de instalação e compatibilidade elétrica nas especificações do fabricante antes de instalar.',
    options: {
      color: [],
      type: [],
    },
    price: 24,
    stock: 1,
    category: 'Tecnologia',
    categoryId: 'tecnologia',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos11/produto11.jpg',
      'img/produtos11/produto1111.jpg',
      'img/produtos11/produto111111.jpg'
    ],
  },

   {
    id: 'KL-509',
    name: 'Kit com 6 Navalhas',
    description: 'Conjunto de reposição para cuidados pessoais',
    details: 'Kit com 6 navalhas para cuidados pessoais. Mantenha as lâminas limpas, manuseie com cuidado e guarde fora do alcance de crianças.',
    options: {
      color: [],
      type: [],
    },
    price: 19.9,
    stock: 2,
    category: 'Beleza',
    categoryId: 'beleza',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos12/produto12.jpg',
      'img/produtos12/produto1212.jpg',
      'img/produtos12/produto121212.jpg'
    ],
  },
   {
    id: 'KL-510',
    name: 'Kit de Manicure com 16 Peças',
    description: 'Acessórios para cuidados com as unhas · cor sortida',
    details: 'Kit com 16 peças para cuidados e manutenção das unhas, organizado para facilitar o uso em casa ou em viagens. O conteúdo inclui acessórios para manicure; o envio da cor é sortido conforme disponibilidade. Higienize os itens antes e depois do uso.',
    options: {
      color: [],
      type: [],
    },
    price: 24.99,
    stock: 2,
    category: 'Beleza',
    categoryId: 'beleza',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos13/produto13.jpg',
      'img/produtos13/produto1313.jpg',
      'img/produtos13/produto131313.jpg'
    ],
  },
   {
    id: 'KL-511',
    name: 'Mouse Bluetooth',
    description: 'Mouse sem fio disponível nas cores rosa e cinza',
    details: 'Mouse Bluetooth sem fio para uso com dispositivos compatíveis. Conecte pelo Bluetooth seguindo as instruções do fabricante e selecione a cor rosa ou cinza disponível. Verifique a compatibilidade do seu aparelho antes da compra.',
    price: 38,
    stockByColor: {
      Rosa: 1,
      Cinza: 2,
    },
    category: 'Tecnologia',
    categoryId: 'tecnologia',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos14/produto14.jpg',
      'img/produtos14/produto1414.jpg',
      'img/produtos14/produto141414.jpg'
    ],
    options: {
      color: ['Rosa', 'Cinza'],
      type: [],
    },
  },

   {
    id: 'KL-512',
    name: 'Kit com 500 Unhas Postiças Stiletto',
    description: 'Formato stiletto para personalizar suas unhas',
    details: 'Kit com 500 unhas postiças em formato stiletto para criar diferentes combinações e estilos. Escolha o tamanho adequado para cada unha e utilize adesivo próprio, seguindo as instruções do fabricante. Adesivo não incluso.',
    options: {
      color: [],
      type: [],
    },
    price: 25.0,
    stock: 8,
    category: 'Beleza',
    categoryId: 'beleza',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos15/produto15.jpg',
      'img/produtos15/produto1515.jpg',
      'img/produtos15/produto151515.jpg'
    ],
  },

   {
    id: 'KL-506',
    name: 'Kit com 115 Ferramentas',
    description: 'Conjunto variado para reparos e projetos manuais',
    details: 'Kit com 115 ferramentas e acessórios para pequenos reparos e projetos manuais. O estojo ajuda a manter as peças organizadas. Confira a composição e as recomendações de uso do fabricante antes de utilizar cada ferramenta.',
    options: {
      color: [],
      type: [],
    },
    price: 45.0,
    stock: 1,
    category: 'Ferramentas',
    categoryId: 'ferramenta',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos16/produto16.jpg',
      'img/produtos16/produto1616.jpg',
      'img/produtos16/produto161616.jpg'
    ],
  },

   {
    id: 'KL-513',
    name: 'Mixer Elétrico Recarregável',
    description: 'Mixer portátil para misturas e preparos rápidos',
    details: 'Mixer elétrico portátil e recarregável para misturas e preparos rápidos. Carregue conforme as instruções do fabricante e higienize as partes indicadas após o uso. Não mergulhe o corpo do aparelho na água.',
    options: {
      color: [],
      type: [],
    },
    price: 25.9,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos17/produto17.jpg',
      'img/produtos17/produto1717.jpg',
      'img/produtos17/produto171717.jpg'
    ],
  },

   {
    id: 'KL-514',
    name: 'Raspador de Língua',
    description: 'Acessório reutilizável para higiene bucal diária',
    details: 'Raspador de língua reutilizável para complementar a higiene bucal diária. Use suavemente, lave antes e depois do uso e mantenha o acessório individual. Interrompa o uso se houver desconforto.',
    options: {
      color: [],
      type: [],
    },
    price: 12.95,
    stock: 1,
    category: 'Saúde',
    categoryId: 'saude',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos18/produto18.jpg',
      'img/produtos18/produto1818.jpg',
      'img/produtos18/produto181818.jpg'
    ],
  },

   {
    id: 'KL-515',
    name: 'Pincel para Sobrancelha Castanho Claro',
    description: 'Pincel de precisão para preencher e definir sobrancelhas',
    details: 'Pincel de precisão na cor castanho claro para auxiliar na definição das sobrancelhas.',
    options: {
      color: [],
      type: [],
    },
    price: 15.7,
    stock: 2,
    category: 'Beleza',
    categoryId: 'beleza',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos19/produto19.jpg',
      'img/produtos19/produto1919.jpg',
      'img/produtos19/produto191919.jpg'
    ],
  },

   {
    id: 'KL-516',
    name: 'Escova Dental Elétrica com 4 Refis',
    description: 'Acompanha quatro refis · disponível em três cores',
    details: 'Escova dental elétrica acompanhada por quatro refis. Escolha entre preto, branco ou rosa conforme o estoque disponível. Consulte as instruções do fabricante para carregamento, limpeza e substituição das cerdas; confirme a compatibilidade dos refis antes de comprar.',
    price: 25,
    stockByColor: {
      Preto: 2,
      Branco: 2,
      Rosa: 2,
    },
    category: 'Saúde',
    categoryId: 'saude',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos20/produto20.jpg',
      'img/produtos20/produto2020.jpg',
      'img/produtos20/produto202020.jpg'
    ],
    options: {
      color: ['Preto', 'Branco', 'Rosa'],
      type: [],
    },
  },


   {
    id: 'KL-517',
    name: 'Aspirador de Pó Portátil Recarregável',
    description: 'Limpeza prática para pequenas superfícies',
    details: 'Aspirador portátil recarregável para auxiliar na limpeza de pequenas superfícies e cantos. Carregue conforme a orientação do fabricante e esvazie o reservatório após o uso. Não utilize para líquidos, salvo se o fabricante especificar essa função.',
    options: {
      color: [],
      type: [],
    },
    price: 30,
    stock: 7,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos21/produto21.jpg',
      'img/produtos21/produto2121.jpg',
      'img/produtos21/produto212121.jpg'
    ],
  },

   {
    id: 'KL-518',
    name: 'Torneira Prata com Detalhes Pretos',
    description: 'Acabamento moderno para cozinha ou banheiro',
    details: 'Torneira com acabamento prateado e detalhes pretos para compor cozinhas ou banheiros. Antes da instalação, confira as medidas, o tipo de conexão e a compatibilidade com o ponto hidráulico. A instalação deve seguir as especificações do fabricante.',
    options: {
      color: [],
      type: [],
    },
    price: 25,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'vase',
    isNew: true,
    images: [
      'img/produtos22/produto22.jpg',
      'img/produtos22/produto2222.jpg',
      'img/produtos22/produto222222.jpg'
    ],
  },

  {
    id: 'KL-519',
    name: 'Lanterna Elétrica Recarregável',
    description: 'Iluminação portátil para casa e atividades ao ar livre',
    details: 'Lanterna elétrica recarregável para manter uma fonte de luz portátil em casa, no carro ou em atividades ao ar livre. Recarregue antes do uso e consulte as instruções do fabricante para carregamento e conservação.',
    options: {
      color: [],
      type: [],
    },
    price: 20.0,
    stock: 1,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos23/produto23.jpg',
      'img/produtos23/produto2323.jpg',
      'img/produtos23/produto232323.jpg'
    ],
  },


  {
    id: 'KL-520',
    name: 'Carregador portátil 20.000 mAh com cabos e led - cor preto ',
    description: '🔋Legal+ 20.000mAh cabos integrados',
    details: ' Nunca fique sem bateria!  🔋Legal+ com capacidade de 20.000 mAh, esse carregador portátil oferece praticidade e autonomia para carregar seus dispositivos onde estiver.',
    options: {
      color: [],
      type: [],
    },
    price: 129.99,
    stock: 1,
    category: 'Tecnologia',
    categoryId: 'tecnologia',
    color: 'clay',
    shape: 'vase',
    isNew: true,
    images: [
      'img/produtos24/produto24.jpg',
      'img/produtos24/produto2424.jpg',
      'img/produtos24/produto242424.jpg'
    ],
  },


  {
    id: 'RK-859',
    name: 'Porta jóias Cor Rosa* ',
    description: '✨ Porta-joias rosé 💗 Elegância e praticidade para organizar suas joias com charme! 💎🎀 ',
    details: 'Elegância e praticidade em um só produto. Com um design sofisticado e acabamento delicado na cor rosé, é ideal para organizar e armazenar suas joias e batom/gloss, mantendo tudo em um só lugar. Perfeito para presentear alguém especial. ',
    options: {
      color: [],
      type: [],
    },
    price: 16,
    stock: 1,
    category: 'Beleza',
    categoryId: 'beleza',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos26/produto26.jpg',
      'img/produtos26/produto2626.jpg',
      'img/produtos26/produto262626.jpg'
    ],
  },

  {
    id: 'YU-437',
    name: 'Removedor de pelos',
    description: '✨ Removedor de pelos com design ergonômico e tecnologia avançada! ',
    details: 'Remova com facilidade os pelos indesejados de forma rápida e eficiente. ',
    options: {
      color: [],
      type: [],
    },
    price: 15.5,
    stock: 2,
    category: 'Casa',
    categoryId: 'casa',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos25/produto25.jpg',
      'img/produtos25/produto2525.jpg',
      'img/produtos25/produto252525.jpg'
    ],
  },

{
    id: 'YU-438',
    name: '6 Cabeçotes de Escova de Dentes Substituíveis para XIAOMI T100',
    description: '✨ Cabeçotes de escova de dentes substituíveis para XIAOMI T100, garantindo uma higiene bucal eficaz e prática! ',
    details: 'Mantenha sua escova de dentes elétrica XIAOMI T100 sempre em ótimo estado com esses 6 cabeçotes substituíveis. Com cerdas macias e design ergonômico, eles proporcionam uma limpeza eficaz e confortável, garantindo uma higiene bucal completa. ',
    options: {
      color: [],
      type: [],
    },
    price: 18,
    stock: 10,
    category: 'Saúde',
    categoryId: 'saude',
    color: 'clay',
    shape: 'mug',
    isNew: true,
    images: [
      'img/produtos27/produto27.jpg',
      'img/produtos27/produto2727.jpg',
      'img/produtos27/produto272727.jpg'
    ],
  },

];
