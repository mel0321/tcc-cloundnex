import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal, 
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';

// BASE DE DADOS INICIAL DOS DESTINOS COM COMENTÁRIOS PADRÃO (IDs padronizados em String)
const baseDestinosPadrao = [
  { 
    id: "1", 
    nome: "Restaurante Central", 
    categoria: "Restaurante", 
    endereco: "Rua das Flores, Centro 123 - SP", 
    desc: "Cozinha contemporânea com rampa e banheiros adaptados.", 
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500", 
    nMotora: 4.8, 
    nVisual: 3.5,
    comentarios: [
      { id: "c1", usuario: "Carlos Silva", nota: 5, texto: "Rampa excelente na entrada e mesas na altura perfeita!" },
      { id: "c2", usuario: "Ana Costa", nota: 3, texto: "Acessibilidade motora ótima, mas faltou cardápio em Braille." }
    ]
  },
  { 
    id: "2", 
    nome: "Hotel Paraíso Acessível", 
    categoria: "Hospedagem", 
    endereco: "Av Oceanica, 450 - BA", 
    desc: "Quartos amplos adaptados e elevadores panorâmicos táteis.", 
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500", 
    nMotora: 4.2, 
    nVisual: 4.8,
    comentarios: [
      { id: "c3", usuario: "Marcos Lima", nota: 5, texto: "Piso tátil por todo o hotel e funcionários muito bem treinados." }
    ]
  }
];

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Inicio'); 
  const [tipoLogado, setTipoLogado] = useState(null); 
  
  // Modais de Controle
  const [modalVisible, setModalVisible] = useState(false);
  const [abaModal, setAbaModal] = useState('entrar'); 
  const [perfilModal, setPerfilModal] = useState('usuario'); 
  
  // Estado que gerencia o destino aberto (Ajustado para forçar re-renderização)
  const [destinoSelecionado, setDestinoSelecionado] = useState(null);
  const [modalDestinoVisible, setModalDestinoVisible] = useState(false);

  // Controle de Expansão dos Pilares (Accordion)
  const [pilarAberto, setPilarAberto] = useState(null);

  // Estados do formulário de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');

  // Estados da lista de destinos
  const [destinos, setDestinos] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');

  // Estados para nova avaliação
  const [novoComentario, setNovoComentario] = useState('');
  const [novaNotaMotora, setNovaNotaMotora] = useState('5');
  const [novaNotaVisual, setNovaNotaVisual] = useState('5');

  // Carregar dados iniciais ao abrir o App
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const loginSalvo = await AsyncStorage.getItem('tipoLogado');
        if (loginSalvo) setTipoLogado(loginSalvo);

        const destinosSalvos = await AsyncStorage.getItem('bancoDestinos');
        if (destinosSalvos) {
          setDestinos(JSON.parse(destinosSalvos));
        } else {
          await AsyncStorage.setItem('bancoDestinos', JSON.stringify(baseDestinosPadrao));
          setDestinos(baseDestinosPadrao);
        }
      } catch (e) {
        console.log(e);
      }
    };
    carregarDados();
  }, []);

  // Realizar o Login/Cadastro
  const lidarComAutenticacao = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await AsyncStorage.setItem('tipoLogado', perfilModal);
      setTipoLogado(perfilModal);
      setModalVisible(false);
      setEmail(''); setSenha(''); setNome('');
      Alert.alert("Sucesso", `Conectado como ${perfilModal === 'empresa' ? 'Empresa' : 'Usuário'}!`);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível fazer login.");
    }
  };

  // Logout
  const fazerLogout = async () => {
    await AsyncStorage.removeItem('tipoLogado');
    setTipoLogado(null);
    setTelaAtual('Inicio');
    Alert.alert("Sair", "Você foi deslogado do sistema.");
  };

  // Alternar Accordion dos Pilares
  const togglePilar = (pilar) => {
    setPilarAberto(pilarAberto === pilar ? null : pilar);
  };

  // Abrir detalhes com segurança garantindo que o estado mude antes do modal aparecer
  const abrirDetalhesDestino = (item) => {
    setDestinoSelecionado(item);
    setModalDestinoVisible(true);
  };

  // Adicionar Comentário/Avaliação
  const adicionarAvaliacao = async () => {
    if (!tipoLogado) {
      Alert.alert("Aviso", "Você precisa estar logado para avaliar.");
      setModalDestinoVisible(false);
      setModalVisible(true);
      return;
    }

    if (!novoComentario.trim()) {
      Alert.alert("Erro", "Escreva um comentário antes de enviar.");
      return;
    }

    const nM = parseFloat(novaNotaMotora) || 5;
    const nV = parseFloat(novaNotaVisual) || 5;

    const listaAtualizada = destinos.map(d => {
      if (d.id === destinoSelecionado.id) {
        const novosComentarios = [
          ...d.comentarios,
          {
            id: Math.random().toString(),
            usuario: "Você",
            nota: Math.round((nM + nV) / 2),
            texto: novoComentario
          }
        ];

        const mMotora = ((d.nMotora + nM) / 2).toFixed(1);
        const mVisual = ((d.nVisual + nV) / 2).toFixed(1);

        const destinoAtualizado = { 
          ...d, 
          comentarios: novosComentarios,
          nMotora: parseFloat(mMotora),
          nVisual: parseFloat(mVisual)
        };
        
        setDestinoSelecionado(destinoAtualizado);
        return destinoAtualizado;
      }
      return d;
    });

    setDestinos(listaAtualizada);
    await AsyncStorage.setItem('bancoDestinos', JSON.stringify(listaAtualizada));
    setNovoComentario('');
    Alert.alert("Sucesso", "Obrigado pela sua avaliação!");
  };

  // Cadastrar Novo Estabelecimento (Painel Empresa)
  const [novoNome, setNovoNome] = useState('');
  const [novoEnd, setNovoEnd] = useState('');
  const [novoDesc, setNovoDesc] = useState('');
  const [novaCat, setNovaCat] = useState('Restaurante');

  const cadastrarNovoLocal = async () => {
    if (!novoNome || !novoEnd || !novoDesc) {
      Alert.alert("Erro", "Preencha todos os campos do local.");
      return;
    }
    const novoItem = {
      id: Math.random().toString(),
      nome: novoNome,
      categoria: novaCat,
      endereco: novoEnd,
      desc: novoDesc,
      img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      nMotora: 4.5,
      nVisual: 4.0,
      comentarios: []
    };

    const listaAtualizada = [...destinos, novoItem];
    setDestinos(listaAtualizada);
    await AsyncStorage.setItem('bancoDestinos', JSON.stringify(listaAtualizada));
    Alert.alert("Sucesso", "Estabelecimento publicado!");
    setNovoNome(''); setNovoEnd(''); setNovoDesc('');
    setTelaAtual('Destinos');
  };

  return (
    <View style={styles.container}>
      {/* HEADER GLOBAL */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextoAzul}>Viagens sem </Text>
          <Text style={styles.logoTextoEscuro}>Barreiras</Text>
        </View>

        {tipoLogado ? (
          <TouchableOpacity style={[styles.avatar, tipoLogado === 'empresa' ? styles.avatarEmpresa : styles.avatarUsuario]} onPress={() => {
            Alert.alert(
              "Minha Conta", 
              `Logado como ${tipoLogado.toUpperCase()}`,
              [
                { text: "Cancelar", style: "cancel" },
                tipoLogado === 'empresa' ? { text: "Painel Empresa", onPress: () => setTelaAtual('Dashboard') } : null,
                { text: "Sair", onPress: fazerLogout, style: "destructive" }
              ].filter(Boolean)
            );
          }}>
            <Text style={styles.avatarText}>{tipoLogado === 'empresa' ? 'E' : 'U'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnEntrarHeader} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnEntrarText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTEÚDO DINÂMICO RENDERIZADO */}
      <ScrollView style={styles.conteudo}>
        
        {/* TELA: INÍCIO */}
        {telaAtual === 'Inicio' && (
          <View style={styles.containerInicio}>
            <View style={styles.cardHero}>
              <Feather name="compass" size={40} color="#ffffff" style={{ marginBottom: 15 }} />
              <Text style={styles.tituloBoasVindas}>Explore o mundo sem barreiras</Text>
              <Text style={styles.subtituloHero}>
                Encontre hotéis, restaurantes e pontos turísticos totalmente adaptados para o que você precisa.
              </Text>
            </View>

            <View style={styles.secaoRecursos}>
              <Text style={styles.tituloSecao}>Por que usar o app?</Text>
              
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="search" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Busca Inteligente</Text>
                  <Text style={styles.recursoDesc}>Filtre os destinos por categorias e localizações.</Text>
                </View>
              </View>

              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="award" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Avaliações Reais</Text>
                  <Text style={styles.recursoDesc}>Notas específicas para acessibilidade motora e visual.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrincipalInicio} onPress={() => setTelaAtual('Destinos')}>
              <Text style={styles.btnPrincipalText}>Começar a Buscar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DESTINOS (100% MINIMALISTA) */}
        {telaAtual === 'Destinos' && (
          <View style={{ padding: 15 }}>
            <View style={styles.searchSection}>
              <Feather style={styles.searchIcon} name="search" size={18} color="#64748b" />
              <TextInput 
                style={styles.inputBuscaMinimalista} 
                placeholder="Digite o nome ou endereço..." 
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 15 }}>
              {['Todos', 'Restaurante', 'Hospedagem', 'Ponto Turístico'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.btnFiltro, categoriaFiltro === cat && styles.btnFiltroAtivo]}
                  onPress={() => setCategoriaFiltro(cat)}
                >
                  <Text style={[styles.btnFiltroText, categoriaFiltro === cat && styles.btnFiltroTextAtivo]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {destinos
              .filter(d => (categoriaFiltro === 'Todos' || d.categoria === categoriaFiltro) && d.nome.toLowerCase().includes(busca.toLowerCase()))
              .map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => abrirDetalhesDestino(item)}
                >
                  <Image source={{ uri: item.img }} style={styles.cardImg} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTag}>{item.categoria}</Text>
                    <Text style={styles.cardTitulo}>{item.nome}</Text>
                    
                    <View style={styles.inlineInfoRow}>
                      <Feather name="map-pin" size={13} color="#64748b" />
                      <Text style={styles.cardEnderecoMinimalista}>{item.endereco}</Text>
                    </View>

                    <Text style={styles.cardDesc}>{item.desc}</Text>
                    
                    <View style={styles.badgeRow}>
                      <View style={styles.miniBadge}>
                        <Ionicons name="accessibility" size={14} color="#0055ff" />
                        <Text style={styles.miniBadgeText}> Motora: {item.nMotora}</Text>
                      </View>
                      <View style={styles.miniBadge}>
                        <Feather name="eye" size={14} color="#d97706" />
                        <Text style={styles.miniBadgeText}> Visual: {item.nVisual}</Text>
                      </View>
                      <View style={[styles.miniBadge, {marginLeft: 'auto', backgroundColor: '#e0eaff'}]}>
                        <Text style={[styles.miniBadgeText, {color: '#0055ff', fontWeight: '700'}]}>Ver Detalhes</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* TELA: PILARES DE ACESSIBILIDADE INTERATIVOS (100% MINIMALISTA) */}
        {telaAtual === 'Acessibilidade' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Guia de Acessibilidade</Text>
            <Text style={[styles.subtituloPage, { textAlign: 'left', marginBottom: 20 }]}>
              Selecione uma das frentes para entender os critérios estruturais de inclusão urbana.
            </Text>

            {/* PILAR MOTORA */}
            <TouchableOpacity 
              style={[styles.pilarBox, { borderLeftColor: '#0055ff' }, pilarAberto === 'motora' && styles.pilarAtivoBox]} 
              onPress={() => togglePilar('motora')}
              activeOpacity={0.7}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Ionicons name="accessibility-outline" size={20} color="#0055ff" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Motora</Text>
                </View>
                <Feather name={pilarAberto === 'motora' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Garantia de livre circulação física e eliminação de barreiras arquitetônicas.</Text>
              
              {pilarAberto === 'motora' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• **Infraestrutura:** Rampas de acesso com inclinação padrão ABNT (NBR 9050), portas com vãos mínimos de 80cm e corredores amplos.</Text>
                  <Text style={styles.pilarTopico}>• **Sanitários:** Banheiros adaptados contendo barras de apoio firmes, bacia sanitária elevada e alarmes de emergência no chão.</Text>
                  <Text style={styles.pilarTopico}>• **Mobiliário:** Mesas e balcões com altura livre inferior para encaixe perfeito de cadeiras de rodas.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PILAR VISUAL */}
            <TouchableOpacity 
              style={[styles.pilarBox, { borderLeftColor: '#d97706' }, pilarAberto === 'visual' && styles.pilarAtivoBox]} 
              onPress={() => togglePilar('visual')}
              activeOpacity={0.7}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="eye" size={20} color="#d97706" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Visual</Text>
                </View>
                <Feather name={pilarAberto === 'visual' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Autonomia direcional, sinalização tátil e canais de comunicação alternativos.</Text>
              
              {pilarAberto === 'visual' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• **Piso Tátil:** Aplicação correta de pisos direcionais (guiam a caminhada) e de alerta (indicam perigo ou mudança de direção).</Text>
                  <Text style={styles.pilarTopico}>• **Comunicação:** Textos em Braille em corrimãos, elevadores, portas e cardápios turísticos digitais totalmente compatíveis com leitores de tela.</Text>
                  <Text style={styles.pilarTopico}>• **Contraste:** Uso de faixas de sinalização visual de alto contraste em superfícies de vidro e degraus de escada.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PILAR AUDITIVA */}
            <TouchableOpacity 
              style={[styles.pilarBox, { borderLeftColor: '#10b981' }, pilarAberto === 'auditiva' && styles.pilarAtivoBox]} 
              onPress={() => togglePilar('auditiva')}
              activeOpacity={0.7}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="volume-x" size={20} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Auditiva</Text>
                </View>
                <Feather name={pilarAberto === 'auditiva' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Sistemas de alertas luminosos e quebra de barreiras de comunicação verbal.</Text>
              
              {pilarAberto === 'auditiva' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• **Sinalização:** Instalação de campainhas visuais, alarmes de incêndio estroboscópicos e painéis digitais explicativos.</Text>
                  <Text style={styles.pilarTopico}>• **Linguagem:** Presença de intérpretes de Libras ou sistemas modernos de tradução automatizada via avatares digitais.</Text>
                  <Text style={styles.pilarTopico}>• **Legendas:** Vídeos e materiais institucionais obrigatoriamente legendados e com áudio limpo.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* PILAR INTELECTUAL */}
            <TouchableOpacity 
              style={[styles.pilarBox, { borderLeftColor: '#8b5cf6' }, pilarAberto === 'intelectual' && styles.pilarAtivoBox]} 
              onPress={() => togglePilar('intelectual')}
              activeOpacity={0.7}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="activity" size={20} color="#8b5cf6" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Intelectual</Text>
                </View>
                <Feather name={pilarAberto === 'intelectual' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Sinalizações simplificadas que reduzem a sobrecarga cognitiva.</Text>
              
              {pilarAberto === 'intelectual' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• **Comunicação Simples:** Textos curtos adaptados no modelo Easy-to-Read (leitura fácil), sem linguagem conotativa ou confusa.</Text>
                  <Text style={styles.pilarTopico}>• **Sinalização por Pictogramas:** Uso forte de ícones descritivos padronizados internacionalmente junto aos textos regulamentares.</Text>
                  <Text style={styles.pilarTopico}>• **Salas de Descompressão:** Espaços projetados com baixo estímulo sonoro para regulação sensorial.</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DASHBOARD EMPRESA */}
        {telaAtual === 'Dashboard' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Painel da Empresa</Text>
            <Text style={styles.subtituloPage}>Cadastre o seu local no nosso mapa acessível</Text>
            
            <TextInput style={styles.inputForm} placeholder="Nome do Estabelecimento" value={novoNome} onChangeText={setNovoNome} />
            <TextInput style={styles.inputForm} placeholder="Endereço Completo" value={novoEnd} onChangeText={setNovoEnd} />
            <TextInput style={styles.inputForm} placeholder="Descrição das Acessibilidades" value={novoDesc} onChangeText={setNovoDesc} multiline />
            
            <TouchableOpacity style={styles.btnPrincipal} onPress={cadastrarNovoLocal}>
              <Text style={styles.btnPrincipalText}>Publicar Local</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* MODAL DETALHADO DO DESTINO (CONSERTADO) */}
      <Modal visible={modalDestinoVisible} animationType="slide" transparent={false}>
        {destinoSelecionado && (
          <View style={{ flex: 1, backgroundColor: '#f3f6fa' }}>
            <ScrollView>
              <Image source={{ uri: destinoSelecionado.img }} style={{ width: '100%', height: 240 }} />
              
              <TouchableOpacity style={styles.btnFecharDestino} onPress={() => setModalDestinoVisible(false)}>
                <Feather name="arrow-left" size={24} color="#051334" />
              </TouchableOpacity>

              <View style={{ padding: 20 }}>
                <Text style={styles.cardTag}>{destinoSelecionado.categoria}</Text>
                <Text style={[styles.cardTitulo, { fontSize: 24, marginBottom: 5 }]}>{destinoSelecionado.nome}</Text>
                
                <View style={[styles.inlineInfoRow, { marginBottom: 15 }]}>
                  <Feather name="map-pin" size={14} color="#64748b" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{destinoSelecionado.endereco}</Text>
                </View>

                <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 25 }}>{destinoSelecionado.desc}</Text>

                <View style={styles.divisor} />

                {/* GRÁFICOS DE ACESSIBILIDADE MINIMALISTAS */}
                <Text style={[styles.tituloSecao, { marginBottom: 15 }]}>Níveis de Acessibilidade</Text>
                
                <View style={{ marginBottom: 15 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: '600', color: '#051334' }}>♿ Acessibilidade Motora</Text>
                    <Text style={{ fontWeight: '700', color: '#0055ff' }}>{destinoSelecionado.nMotora} / 5.0</Text>
                  </View>
                  <View style={styles.barraGraficoFundo}>
                    <View style={[styles.barraGraficoPreenchimento, { width: `${(destinoSelecionado.nMotora / 5) * 100}%`, backgroundColor: '#0055ff' }]} />
                  </View>
                </View>

                <View style={{ marginBottom: 25 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: '600', color: '#051334' }}>👁️ Acessibilidade Visual</Text>
                    <Text style={{ fontWeight: '700', color: '#d97706' }}>{destinoSelecionado.nVisual} / 5.0</Text>
                  </View>
                  <View style={styles.barraGraficoFundo}>
                    <View style={[styles.barraGraficoPreenchimento, { width: `${(destinoSelecionado.nVisual / 5) * 100}%`, backgroundColor: '#d97706' }]} />
                  </View>
                </View>

                <View style={styles.divisor} />

                {/* SEÇÃO DE COMENTÁRIOS */}
                <Text style={[styles.tituloSecao, { marginBottom: 15 }]}>Comentários ({destinoSelecionado.comentarios ? destinoSelecionado.comentarios.length : 0})</Text>
                
                {(!destinoSelecionado.comentarios || destinoSelecionado.comentarios.length === 0) ? (
                  <Text style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 20 }}>Nenhum comentário ainda. Seja o primeiro!</Text>
                ) : (
                  destinoSelecionado.comentarios.map(c => (
                    <View key={c.id} style={styles.boxComentario}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ fontWeight: '700', color: '#051334' }}>{c.usuario}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Feather name="star" size={12} color="#d97706" style={{ marginRight: 3 }} />
                          <Text style={{ color: '#d97706', fontWeight: '600' }}>{c.nota}/5</Text>
                        </View>
                      </View>
                      <Text style={{ color: '#475569', fontSize: 13, lineHeight: 18 }}>{c.texto}</Text>
                    </View>
                  ))
                )}

                <View style={styles.divisor} />

                {/* FORMULÁRIO PARA ADICIONAR COMENTÁRIO */}
                <Text style={[styles.tituloSecao, { marginBottom: 10 }]}>Deixe sua Avaliação</Text>
                
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labelForm}>Nota Motora (1-5)</Text>
                    <TextInput style={styles.inputForm} keyboardType="numeric" maxLength={1} value={novaNotaMotora} onChangeText={setNovaNotaMotora} placeholder="5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labelForm}>Nota Visual (1-5)</Text>
                    <TextInput style={styles.inputForm} keyboardType="numeric" maxLength={1} value={novaNotaVisual} onChangeText={setNovaNotaVisual} placeholder="5" />
                  </View>
                </View>

                <TextInput 
                  style={[styles.inputForm, { height: 80, textAlignVertical: 'top' }]} 
                  placeholder="Escreva como foi sua experiência de acessibilidade..." 
                  multiline
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                />

                <TouchableOpacity style={styles.btnPrincipal} onPress={adicionarAvaliacao}>
                  <Text style={styles.btnPrincipalText}>Enviar Avaliação</Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* MENU DE NAVEGAÇÃO INFERIOR MINIMALISTA */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Inicio')}>
          <Ionicons name="home-outline" size={22} color={telaAtual === 'Inicio' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.tabText, telaAtual === 'Inicio' && styles.tabTextAtivo]}>Início</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Destinos')}>
          <Ionicons name="map-outline" size={22} color={telaAtual === 'Destinos' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.tabText, telaAtual === 'Destinos' && styles.tabTextAtivo]}>Destinos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Acessibilidade')}>
          <Ionicons name="accessibility-outline" size={22} color={telaAtual === 'Acessibilidade' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.tabText, telaAtual === 'Acessibilidade' && styles.tabTextAtivo]}>Pilares</Text>
        </TouchableOpacity>

        {tipoLogado === 'empresa' && (
          <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Dashboard')}>
            <Ionicons name="business-outline" size={22} color={telaAtual === 'Dashboard' ? '#0055ff' : '#64748b'} />
            <Text style={[styles.tabText, telaAtual === 'Dashboard' && styles.tabTextAtivo]}>Painel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL DE LOGIN */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalAbas}>
              <TouchableOpacity onPress={() => setAbaModal('entrar')} style={{ flex: 1 }}>
                <Text style={[styles.abaTexto, abaModal === 'entrar' && styles.abaTextoAtiva]}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAbaModal('cadastrar')} style={{ flex: 1 }}>
                <Text style={[styles.abaTexto, abaModal === 'cadastrar' && styles.abaTextoAtiva]}>Criar Conta</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.perfilRow}>
              <TouchableOpacity 
                style={[styles.btnPerfilMod, perfilModal === 'usuario' && { borderColor: '#0055ff', backgroundColor: '#e0eaff' }]} 
                onPress={() => setPerfilModal('usuario')}
              >
                <Text style={{ fontWeight: '700', color: perfilModal === 'usuario' ? '#0055ff' : '#475569' }}>👤 Usuário</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnPerfilMod, perfilModal === 'empresa' && { borderColor: '#d97706', backgroundColor: '#fef3c7' }]} 
                onPress={() => setPerfilModal('empresa')}
              >
                <Text style={{ fontWeight: '700', color: perfilModal === 'empresa' ? '#d97706' : '#475569' }}>🏢 Empresa</Text>
              </TouchableOpacity>
            </View>

            {abaModal === 'cadastrar' && (
              <TextInput style={styles.inputForm} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
            )}
            <TextInput style={styles.inputForm} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.inputForm} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

            <TouchableOpacity style={styles.btnPrincipal} onPress={lidarComAutenticacao}>
              <Text style={styles.btnPrincipalText}>{abaModal === 'entrar' ? 'Acessar Conta' : 'Concluir Registro'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#64748b', textDecorationLine: 'underline' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ESTILIZAÇÃO UNIFICADA E CLEAN
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fa', paddingTop: 45 },
  header: { height: 70, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  logoContainer: { flexDirection: 'row' },
  logoTextoAzul: { fontSize: 18, fontWeight: '700', color: '#0055ff' },
  logoTextoEscuro: { fontSize: 18, fontWeight: '700', color: '#051334' },
  btnEntrarHeader: { borderWidth: 1, borderColor: '#0055ff', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 15 },
  btnEntrarText: { color: '#0055ff', fontWeight: '700', fontSize: 13 },
  
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarUsuario: { backgroundColor: '#0055ff' },
  avatarEmpresa: { backgroundColor: '#d97706' },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  conteudo: { flex: 1 },
  tituloPage: { fontSize: 22, fontWeight: '700', color: '#051334', marginBottom: 10 },
  subtituloPage: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  
  btnPrincipal: { backgroundColor: '#0055ff', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center', marginTop: 10 },
  btnPrincipalText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  // INÍCIO DESIGN ATUALIZADO
  containerInicio: { padding: 20, alignItems: 'center' },
  cardHero: { backgroundColor: '#051334', padding: 25, borderRadius: 24, width: '100%', alignItems: 'center', marginBottom: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  tituloBoasVindas: { fontSize: 24, fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  subtituloHero: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', lineHeight: 22 },
  secaoRecursos: { width: '100%', marginBottom: 30 },
  tituloSecao: { fontSize: 18, fontWeight: '700', color: '#051334', marginBottom: 15 },
  recursoItem: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  wrapperIcone: { backgroundColor: '#e0eaff', padding: 10, borderRadius: 12, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  recursoTextoContainer: { flex: 1 },
  recursoTitulo: { fontSize: 15, fontWeight: '700', color: '#051334', marginBottom: 2 },
  recursoDesc: { fontSize: 13, color: '#64748b' },
  btnPrincipalInicio: { backgroundColor: '#0055ff', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 20, width: '100%', alignItems: 'center', elevation: 3, shadowColor: '#0055ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },

  // DESTINOS DESIGN MINIMALISTA SEM EMOJIS
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 15, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  inputBuscaMinimalista: { flex: 1, height: 45, fontSize: 14, color: '#051334' },
  inlineInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  cardEnderecoMinimalista: { fontSize: 12, color: '#64748b', marginLeft: 4 },

  btnFiltro: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, marginRight: 8, height: 32 },
  btnFiltroAtivo: { backgroundColor: '#0055ff', borderColor: '#0055ff' },
  btnFiltroText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  btnFiltroTextAtivo: { color: '#ffffff' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardImg: { width: '100%', height: 180 },
  cardBody: { padding: 15 },
  cardTag: { alignSelf: 'flex-start', backgroundColor: '#051334', color: '#ffffff', fontSize: 10, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, marginBottom: 5 },
  cardTitulo: { fontSize: 18, fontWeight: '700', color: '#051334' },
  cardDesc: { fontSize: 13, color: '#475569', marginVertical: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  miniBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  miniBadgeText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  // TELA DE DETALHES
  btnFecharDestino: { position: 'absolute', top: 20, left: 20, backgroundColor: '#ffffff', padding: 10, borderRadius: 25, elevation: 5 },
  divisor: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  barraGraficoFundo: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden' },
  barraGraficoPreenchimento: { height: '100%', borderRadius: 6 },
  boxComentario: { backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  labelForm: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },

  // TELA DE PILARES MINIMALISTA
  pilarBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 5 },
  pilarAtivoBox: { borderColor: '#cbd5e1', backgroundColor: '#ffffff', elevation: 2 },
  pilarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pilarTituloComIcone: { flexDirection: 'row', alignItems: 'center' },
  pilarTitulo: { fontSize: 16, fontWeight: '700', color: '#051334' },
  pilarDescShort: { fontSize: 13, color: '#64748b', lineHeight: 18, marginLeft: 28 },
  pilarDropdown: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginLeft: 28 },
  pilarTopico: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 10 },

  // MENUS SUPERIOR/INFERIOR
  tabBar: { height: 65, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  tabTextAtivo: { color: '#0055ff', fontWeight: '700' },

  // MODAIS DE LOGIN
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,19,52,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#ffffff', width: '85%', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalAbas: { flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 15 },
  abaTexto: { fontSize: 16, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  abaTextoAtiva: { color: '#0055ff' },
  perfilRow: { flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%' },
  btnPerfilMod: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', padding: 10, borderRadius: 10, alignItems: 'center' },
  inputForm: { width: '100%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 10, marginBottom: 12 }
});