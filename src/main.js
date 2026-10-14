import './style.css';

// Número que recebe os agendamentos (DDI + DDD + número, só dígitos).
const WHATSAPP = '5541998531363';

const TERAPIAS = {
  corpo: [
    {
      nome: 'Drenagem linfática',
      desc: 'Movimentos lentos, leves e ritmados que estimulam o sistema linfático. Ajuda a reduzir o inchaço e aquela sensação de peso nas pernas.',
    },
    {
      nome: 'Pós-operatório',
      desc: 'Drenagem e cuidados pensados para cada fase da recuperação, sempre alinhados com a orientação do seu médico.',
    },
    {
      nome: 'Aplicação de taping',
      desc: 'Fitas elásticas terapêuticas que dão suporte à musculatura e prolongam os efeitos da sessão até o próximo atendimento.',
    },
    {
      nome: 'Massagem modeladora',
      desc: 'Manobras firmes e ritmadas, com foco em contorno corporal e na ativação da circulação.',
    },
    {
      nome: 'Massagens terapêuticas',
      desc: 'Para tensões, dores e contraturas do dia a dia. Pressão e foco são definidos junto com você, no começo da sessão.',
    },
    {
      nome: 'Reflexologia',
      desc: 'Pressão em pontos dos pés que se relacionam com diferentes regiões do corpo. Uma pausa profunda, sem precisar tirar a roupa.',
    },
    {
      nome: 'Massagens relaxantes',
      desc: 'Toques contínuos e envolventes, com óleo morno, para desacelerar o corpo e a cabeça.',
    },
    {
      nome: 'Aplicação de ventosas',
      desc: 'Copos que criam uma leve sucção na pele, soltando a musculatura e ativando a circulação local.',
    },
  ],
  asia: [
    {
      nome: 'Zen Shiatsu',
      origem: 'Japão',
      desc: 'Pressão com dedos e palmas ao longo dos meridianos, buscando o equilíbrio da energia do corpo. Feita com roupa confortável.',
    },
    {
      nome: 'Tuiná',
      origem: 'China',
      desc: 'Técnica da medicina tradicional chinesa: amassamentos, pressões e mobilizações sobre pontos e meridianos.',
    },
    {
      nome: 'Thai massagem',
      origem: 'Tailândia',
      desc: 'Alongamentos assistidos e pressões ritmadas, sem óleo. Quase um yoga feito a dois — você só precisa se entregar.',
    },
  ],
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const linkWhats = (texto) =>
  `https://wa.me/${WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

/* ---------- lista de terapias ---------- */
function montarListas() {
  let n = 0;
  for (const [grupo, itens] of Object.entries(TERAPIAS)) {
    const ol = $(`.lista[data-grupo="${grupo}"]`);
    ol.innerHTML = itens
      .map((t) => {
        n += 1;
        return `
        <li class="item revelar">
          <button type="button" class="item__botao" data-terapia="${t.nome}">
            <span class="item__n">${String(n).padStart(2, '0')}</span>
            <span class="item__nome">${t.nome}${t.origem ? `<small>${t.origem}</small>` : ''}</span>
            <span class="item__desc">${t.desc}</span>
            <span class="item__seta" aria-hidden="true">
              <span>Agendar</span>
              <svg viewBox="0 0 24 12" width="24" height="12"><path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1"/></svg>
            </span>
          </button>
        </li>`;
      })
      .join('');
  }

  // opções do select
  const sel = $('#f-terapia');
  const grupos = { corpo: 'Corpo & estética', asia: 'Massagens asiáticas' };
  for (const [grupo, itens] of Object.entries(TERAPIAS)) {
    const og = document.createElement('optgroup');
    og.label = grupos[grupo];
    for (const t of itens) og.append(new Option(t.nome, t.nome));
    sel.append(og);
  }

  // clicar numa terapia pré-seleciona no formulário
  $$('[data-terapia]').forEach((b) =>
    b.addEventListener('click', () => {
      sel.value = b.dataset.terapia;
      $('#agendar').scrollIntoView({ behavior: 'smooth' });
      sel.classList.remove('pulso');
      void sel.offsetWidth;
      sel.classList.add('pulso');
      setTimeout(() => $('#f-nome').focus({ preventScroll: true }), 700);
    }),
  );
}

/* ---------- formulário → WhatsApp ---------- */
function montarFormulario() {
  const form = $('#form-agendar');
  const nome = $('#f-nome');
  const erro = $('#erro-nome');

  nome.addEventListener('input', () => {
    erro.hidden = true;
    nome.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = nome.value.trim();
    if (!n) {
      erro.hidden = false;
      nome.setAttribute('aria-invalid', 'true');
      nome.focus();
      return;
    }
    const terapia = $('#f-terapia').value;
    const dias = $$('[data-campo="dias"] input:checked').map((i) => i.value);
    const periodo = $('[data-campo="periodo"] input:checked')?.value;
    const obs = $('#f-obs').value.trim();

    const linhas = [
      `Olá, Studio Nami! Me chamo ${n}.`,
      terapia
        ? `Gostaria de agendar: *${terapia}*.`
        : 'Gostaria de agendar uma sessão, mas ainda não sei qual terapia escolher. Podem me indicar?',
    ];
    if (dias.length) linhas.push(`Dias de preferência: ${dias.join(', ')}`);
    if (periodo) linhas.push(`Período: ${periodo}`);
    if (obs) linhas.push(`Observação: ${obs}`);

    window.open(linkWhats(linhas.join('\n')), '_blank', 'noopener');
  });

  $$('[data-whats-direto]').forEach((a) => {
    a.href = linkWhats('Olá, Studio Nami! Gostaria de mais informações.');
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/* ---------- detalhes de movimento ---------- */
function montarMovimento() {
  const topo = $('#topo');
  const flutuante = $('.flutuante');
  const agendar = $('#agendar');
  let agendarVisivel = false;

  const aoRolar = () => {
    const y = window.scrollY;
    topo.classList.toggle('topo--rolado', y > 24);
    flutuante.classList.toggle('flutuante--on', y > window.innerHeight * 0.8 && !agendarVisivel);
  };
  window.addEventListener('scroll', aoRolar, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      agendarVisivel = e.isIntersecting;
      aoRolar();
    }, { threshold: 0.15 }).observe(agendar);

    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visivel');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    $$('.revelar').forEach((el) => io.observe(el));
  } else {
    $$('.revelar').forEach((el) => el.classList.add('visivel'));
  }
  aoRolar();
}

montarListas();
montarFormulario();
montarMovimento();
$('#ano').textContent = new Date().getFullYear();
