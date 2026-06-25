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

// IP DO COMPUTADOR DO LABORATÓRIO (Adaptador Ethernet 2)
const API_URL = "http://192.168.100.254:3000/api";

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Inicio');
  const [tipoLogado, setTipoLogado] = useState(null);

  // Modais de Controle
  const [modalVisible, setModalVisible] = useState(false);
  const [abaModal, setAbaModal] = useState('entrar');
  const [perfilModal, setPerfilModal] = useState('usuario');

  // Estado que gerencia o destino aberto
  const [destinoSelecionado, setDestinoSelecionado] = useState(null);
  const [modalDestinoVisible, setModalDestinoVisible] = useState(false);

  // Controle de Expansão dos Pilares (Accordion)
  const [pilarAberto, setPilarAberto] = useState(null);

  // Estados do formulário de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [confirmarSenha, setConfirmarSenha] = useState('');
  // Estados da lista de destinos
  const [destinos, setDestinos] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');

  // Estados para nova avaliação
  const [novoComentario, setNovoComentario] = useState('');
  const [novaNotaMotora, setNovaNotaMotora] = useState('5');
  const [novaNotaVisual, setNovaNotaVisual] = useState('5');

  // 🔄 Carregar dados vindos do Back-end Real
  const carregarDadosDoServidor = async () => {
    try {
      const loginSalvo = await AsyncStorage.getItem('tipoLogado');
      if (loginSalvo) setTipoLogado(loginSalvo);

      // Requisição para o servidor rodando em Node.js
      const resposta = await fetch(`${API_URL}/places`);
      const dadosServidor = await resposta.json();

      // Converte as propriedades do banco para o padrão que o seu visual espera
      const destinosFormatados = dadosServidor.map(place => ({
        id: place.id.toString(),
        nome: place.establishment_name,
        categoria: place.category === 'ACCOMMODATION' ? 'Hospedagem' : 'Restaurante',
        endereco: place.full_address,
        desc: place.description,
        img: place.main_image,
        nMotora: place.accessibility_score,
        nVisual: 4.0, // Nota padrão inicial
        comentarios: []
      }));

      setDestinos(destinosFormatados);
    } catch (e) {
      console.log("Erro ao conectar com o servidor back-end:", e);
      Alert.alert("Erro de Conexão", "Não foi possível buscar os dados do servidor. O server.js está ligado?");
    }
  };

  useEffect(() => {

    const iniciar = async () => {

      const usuarioSalvo =
        await AsyncStorage.getItem(
          "usuario"
        );

      if (usuarioSalvo) {

        const user =
          JSON.parse(usuarioSalvo);

        setUsuarioLogado(user);

        setTipoLogado(
          user.user_type === "BUSINESS"
            ? "empresa"
            : "usuario"
        );
      }

      carregarDadosDoServidor();
    };

    iniciar();
  }, []);

  // Realizar o Login/Cadastro
  const lidarComAutenticacao = async () => {

    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    try {

      const resposta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password: senha
        })
      });

      const dados = await resposta.json();

      if (!dados.success) {
        Alert.alert("Erro", dados.message);
        return;
      }

      await AsyncStorage.setItem(
        "usuario",
        JSON.stringify(dados.user)
      );

      setUsuarioLogado(dados.user);

      const tipo =
        dados.user.user_type === "BUSINESS"
          ? "empresa"
          : "usuario";

      setTipoLogado(tipo);

      Alert.alert(
        "Sucesso",
        `Bem-vindo ${dados.user.username}`
      );

      setModalVisible(false);

    } catch (erro) {

      Alert.alert(
        "Erro",
        "Não foi possível conectar ao servidor."
      );

    }
  };
  //Criar Conta
  const criarConta = async () => {

    if (!nome || !email || !senha) {
      Alert.alert(
        "Erro",
        "Preencha todos os campos."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        "Erro",
        "As senhas não coincidem."
      );
      return;
    }

    try {

      const resposta = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: nome,
            email,
            password: senha,
            userType:
              perfilModal === "empresa"
                ? "BUSINESS"
                : "TRAVELER"
          })
        }
      );

      const dados = await resposta.json();

      if (!dados.success) {
        Alert.alert(
          "Erro",
          dados.message
        );
        return;
      }

      Alert.alert(
        "Sucesso",
        "Conta criada com sucesso!"
      );

      setAbaModal("entrar");

    } catch (erro) {

      Alert.alert(
        "Erro",
        "Falha ao criar conta."
      );

    }
  };
  // Logout
  const fazerLogout = async () => {

    await AsyncStorage.removeItem(
      "usuario"
    );

    await AsyncStorage.removeItem(
      "tipoLogado"
    );

    setUsuarioLogado(null);
    setTipoLogado(null);

    setTelaAtual("Inicio");

    Alert.alert(
      "Logout",
      "Sessão encerrada."
    );
  };

  // Alternar Accordion dos Pilares
  const togglePilar = (pilar) => {
    setPilarAberto(pilarAberto === pilar ? null : pilar);
  };

  // Abrir detalhes do destino
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

        {/* TELA: DESTINOS */}
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
                      <View style={[styles.miniBadge, { marginLeft: 'auto', backgroundColor: '#e0eaff' }]}>
                        <Text style={[styles.miniBadgeText, { color: '#0055ff', fontWeight: '700' }]}>Ver Detalhes</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* TELA: PILARES */}
        {telaAtual === 'Acessibilidade' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Guia de Acessibilidade</Text>
            <Text style={[styles.subtituloPage, { textAlign: 'left', marginBottom: 20 }]}>
              Selecione uma das frentes para entender os critérios estruturais de inclusão urbana.
            </Text>

            {/* MOTOR */}
            <TouchableOpacity style={[styles.pilarBox, { borderLeftColor: '#0055ff' }, pilarAberto === 'motora' && styles.pilarAtivoBox]} onPress={() => togglePilar('motora')}>
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
                  <Text style={styles.pilarTopico}>• Infraestrutura: Rampas de acesso com inclinação padrão ABNT (NBR 9050), portas com vãos mínimos de 80cm e corredores amplos.</Text>
                  <Text style={styles.pilarTopico}>• Sanitários: Banheiros adaptados contendo barras de apoio firmes, bacia sanitária elevada e alarmes de emergência no chão.</Text>
                  <Text style={styles.pilarTopico}>• Mobiliário: Mesas e balcões com altura livre inferior para encaixe perfeito de cadeiras de rodas.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* VISUAL */}
            <TouchableOpacity style={[styles.pilarBox, { borderLeftColor: '#d97706' }, pilarAberto === 'visual' && styles.pilarAtivoBox]} onPress={() => togglePilar('visual')}>
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
                  <Text style={styles.pilarTopico}>• Piso Tátil: Aplicação correta de pisos direcionais e de alerta.</Text>
                  <Text style={styles.pilarTopico}>• Comunicação: Textos em Braille em corrimãos, elevadores e cardápios turísticos digitais.</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DASHBOARD */}
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

      {/* MODAL DETALHADO DO DESTINO */}
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

                <View style={styles.divisor} />
                <Text style={[styles.tituloSecao, { marginBottom: 10 }]}>Deixe sua Avaliação</Text>
                <TextInput style={[styles.inputForm, { height: 80, textAlignVertical: 'top' }]} placeholder="Escreva como foi sua experiência..." multiline value={novoComentario} onChangeText={setNovoComentario} />
                <TouchableOpacity style={styles.btnPrincipal} onPress={adicionarAvaliacao}>
                  <Text style={styles.btnPrincipalText}>Enviar Avaliação</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* MENU INFERIOR DE NAVEGAÇÃO */}
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
      </View>

      {/* MODAL LOGIN */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setAbaModal('entrar')}>
                <Text style={{
                  fontWeight: abaModal === 'entrar' ? '700' : '400',
                  marginRight: 20
                }}>
                  Entrar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAbaModal('criar')}>
                <Text style={{
                  fontWeight: abaModal === 'criar' ? '700' : '400'
                }}>
                  Criar Conta
                </Text>
              </TouchableOpacity>
            </View>

            {abaModal === 'criar' && (
              <TextInput
                style={styles.inputForm}
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
              />
            )}

            <TextInput
              style={styles.inputForm}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.inputForm}
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />

            {abaModal === 'criar' && (
              <>
                <TextInput
                  style={styles.inputForm}
                  placeholder="Confirmar Senha"
                  secureTextEntry
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />

                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                  <TouchableOpacity onPress={() => setPerfilModal('usuario')}>
                    <Text>👤 Usuário</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ marginLeft: 20 }}
                    onPress={() => setPerfilModal('empresa')}
                  >
                    <Text>🏢 Empresa</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={
                abaModal === 'entrar'
                  ? lidarComAutenticacao
                  : criarConta
              }
            >
              <Text style={styles.btnPrincipalText}>
                {abaModal === 'entrar'
                  ? 'Entrar'
                  : 'Criar Conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#64748b' }}>
                Cancelar
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fa', paddingTop: 45 },
  header: { height: 70, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  logoContainer: { flexDirection: 'row' },
  logoTextoAzul: { fontSize: 18, fontWeight: '700', color: '#0055ff' },
  logoTextoEscuro: { fontSize: 18, fontWeight: '700', color: '#051334' },
  btnEntrarHeader: { borderWidth: 1, borderColor: '#0055ff', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 8 },
  btnEntrarText: { color: '#0055ff', fontWeight: '600' },
  conteudo: { flex: 1 },
  containerInicio: { padding: 20 },
  cardHero: { backgroundColor: '#0055ff', padding: 25, borderRadius: 16, marginBottom: 25 },
  tituloBoasVindas: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 10 },
  subtituloHero: { color: '#e0eaff', fontSize: 14, lineHeight: 20 },
  secaoRecursos: { marginBottom: 25 },
  tituloSecao: { fontSize: 18, fontWeight: '700', color: '#051334' },
  recursoItem: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  wrapperIcone: { backgroundColor: '#e0eaff', padding: 10, borderRadius: 10 },
  recursoTextoContainer: { marginLeft: 15 },
  recursoTitulo: { fontWeight: '700', color: '#051334' },
  recursoDesc: { color: '#64748b', fontSize: 13 },
  btnPrincipalInicio: { backgroundColor: '#0055ff', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPrincipalText: { color: '#ffffff', fontWeight: '700' },
  searchSection: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { padding: 10 },
  inputBuscaMinimalista: { flex: 1, paddingVertical: 10, color: '#051334' },
  btnFiltro: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  btnFiltroAtivo: { backgroundColor: '#0055ff', borderColor: '#0055ff' },
  btnFiltroText: { color: '#64748b' },
  btnFiltroTextAtivo: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardImg: { width: '100%', height: 160 },
  cardBody: { padding: 15 },
  cardTag: { color: '#0055ff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  cardTitulo: { fontSize: 18, fontWeight: '700', color: '#051334', marginVertical: 5 },
  inlineInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardEnderecoMinimalista: { color: '#64748b', fontSize: 13, marginLeft: 5 },
  cardDesc: { color: '#475569', fontSize: 14, marginBottom: 15 },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  miniBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  miniBadgeText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  tabBar: { height: 60, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  tabTextAtivo: { color: '#0055ff', fontWeight: '600' },
  pilarBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 5 },
  pilarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pilarTituloComIcone: { flexDirection: 'row', alignItems: 'center' },
  pilarTitulo: { fontWeight: '700', color: '#051334', fontSize: 15 },
  pilarDescShort: { color: '#64748b', fontSize: 13, marginTop: 5 },
  pilarDropdown: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  pilarTopico: { fontSize: 13, color: '#475569', marginBottom: 8, lineHeight: 18 },
  inputForm: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, marginBottom: 15, color: '#051334' },
  btnPrincipal: { backgroundColor: '#0055ff', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,19,52,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center' },
  btnFecharDestino: { position: 'absolute', top: 40, left: 20, backgroundColor: '#fff', padding: 8, borderRadius: 20 },
  barraGraficoFundo: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barraGraficoPreenchimento: { height: '100%', borderRadius: 4 },
  divisor: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarUsuario: { backgroundColor: '#0055ff' },
  avatarEmpresa: { backgroundColor: '#d97706' },
  avatarText: { color: '#fff', fontWeight: '700' }
});