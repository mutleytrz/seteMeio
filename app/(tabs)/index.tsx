import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// --- COMPONENTE CARTA ---
const CartaMaster = ({ valor, isOculta = false }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const naipes = [{ s: '♥', c: '#ff4d4d' }, { s: '♦', c: '#ff4d4d' }, { s: '♣', c: '#222' }, { s: '♠', c: '#222' }];
  const naipeRef = useRef(naipes[Math.floor(Math.random() * naipes.length)]).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (isOculta) {
    return (
      <Animated.View style={[styles.card, styles.cardBack, { transform: [{ scale: anim }, { translateY: floatAnim }] }]}>
        <Text style={styles.cardBackLogo}>?</Text>
      </Animated.View>
    );
  }

  const label = valor === 0.5 ? '½' : valor;
  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ scale: anim }, { translateY: floatAnim }] }]}>
      <View style={styles.cardCorner}>
        <Text style={[styles.cardV, {color: naipeRef.c}]}>{label}</Text>
        <Text style={[styles.cardSuitSmall, {color: naipeRef.c}]}>{naipeRef.s}</Text>
      </View>
      <View style={styles.centerWrapper}>
        <Text style={[styles.cardCenter, {color: naipeRef.c}]}>{valor === 0.5 ? '👑' : naipeRef.s}</Text>
      </View>
      <View style={[styles.cardCorner, styles.cardCornerBottom]}>
        <Text style={[styles.cardV, {color: naipeRef.c}]}>{label}</Text>
        <Text style={[styles.cardSuitSmall, {color: naipeRef.c}]}>{naipeRef.s}</Text>
      </View>
    </Animated.View>
  );
};

// --- REAÇÃO ---
const ReacaoTexto = ({ texto, cor = '#ffd700' }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50 }),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ]),
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [texto]);

  return (
    <Animated.View style={[styles.reacaoContainer, { 
      opacity: anim, 
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.0] }) }] 
    }]}>
      <Text style={[styles.reacaoTexto, { color: cor }]}>{texto}</Text>
    </Animated.View>
  );
};

const JackpotDisplay = ({ valor, progresso }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.jackpotBox, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.jackpotTitle}>🔥 JACKPOT MASTER 0 🔥</Text>
      <Text style={styles.jackpotValue}>$ {valor.toFixed(2)}</Text>
      <View style={styles.progressContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.progressDot, i <= progresso ? styles.progressDotActive : null]} />
        ))}
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [jogador, setJogador] = useState(0);
  const [maoJogador, setMaoJogador] = useState<any[]>([]); 
  const [banca, setBanca] = useState(0);
  const [maoBanca, setMaoBanca] = useState<any[]>([]); 
  const [resultado, setResultado] = useState('');
  const [reacao, setReacao] = useState<any>(null);
  const [fim, setFim] = useState(false);
  const [fichas, setFichas] = useState(1000);
  const [aposta, setAposta] = useState<number | null>(null);
  const [valorLivre, setValorLivre] = useState('');
  const [primeiraCartaDistribuida, setPrimeiraCartaDistribuida] = useState(false);
  const [valorAumento, setValorAumento] = useState('');
  const [bancaJogando, setBancaJogando] = useState(false);
  const [bloqueioCompra, setBloqueioCompra] = useState(false);
  const [jackpot, setJackpot] = useState(100.00);
  const [progressoJackpot, setProgressoJackpot] = useState(0);
  const [mostrarLoja, setMostrarLoja] = useState(false);

  const monteRef = useRef<number[]>([]);

  const dispararReacao = (msg: string, cor: string = '#ffd700') => {
    setReacao({ msg, cor });
    setTimeout(() => setReacao(null), 2500);
  };

  function tirarCarta() {
    if (monteRef.current.length < 10) {
      let novo: number[] = [];
      const cartasBase = [1, 2, 3, 4, 5, 6, 7];
      cartasBase.forEach(c => { for (let j = 0; j < 8; j++) novo.push(c); });
      for (let j = 0; j < 24; j++) novo.push(0.5); 
      monteRef.current = novo.sort(() => Math.random() - 0.5);
    }
    return monteRef.current.pop() ?? 0.5;
  }

  const handleApostaLivreChange = (txt: string) => {
    const val = Number(txt.replace(/[^0-9]/g, ''));
    if (val <= fichas) setValorLivre(val.toString());
  };

  const handleAumentoChange = (txt: string) => {
    const val = Number(txt.replace(/[^0-9]/g, ''));
    if (val <= fichas) setValorAumento(val.toString());
  };

  function validarEApostar(valor: number) {
    if (fim || aposta !== null || valor <= 0 || valor > fichas) return;
    setFichas(f => f - valor);
    setAposta(valor);
    dispararReacao(`APOSTA: $${valor}`, '#0f0');
  }

  function allIn() {
    if (fichas <= 0) return;
    const total = fichas;
    if (aposta === null) {
      setAposta(total);
      setFichas(0);
    } else {
      setAposta((aposta || 0) + total);
      setFichas(0);
      setBloqueioCompra(true);
    }
    dispararReacao("ALL IN! 🔥", '#ffd700');
  }

  function distribuirPrimeiraCarta() {
    if (fim || primeiraCartaDistribuida || aposta === null) return;
    const carta = tirarCarta();
    setJogador(carta);
    setMaoJogador([carta]);
    setPrimeiraCartaDistribuida(true);
  }

  function aumentarAposta() {
    const v = Number(valorAumento);
    if (isNaN(v) || v <= 0 || v > fichas || aposta === null) return;
    setAposta(aposta + v);
    setFichas(fichas - v);
    setValorAumento('');
    setBloqueioCompra(true);
    dispararReacao("BLEFOU!", '#ff4d4d');
  }

  function comprarCartaJogador() {
    if (fim || aposta === null || aposta <= 0 || bancaJogando || bloqueioCompra) return;
    const carta = tirarCarta();
    const novaMao = [...maoJogador, carta];
    const novaPontuacao = jogador + carta;
    setJogador(novaPontuacao);
    setMaoJogador(novaMao);

    if (novaPontuacao >= 7.5) {
      setFim(true);
      if (novaPontuacao === 7.5) {
        const isOriginal = novaMao.length === 2 && novaMao.includes(7) && novaMao.includes(0.5);
        if (isOriginal) {
          if (progressoJackpot + 1 === 3) {
            setFichas(f => f + (aposta * 4) + jackpot);
            setJackpot(100); setProgressoJackpot(0);
            setResultado('🏆 JACKPOT MASTER!');
            dispararReacao("💰 JACKPOT!! 💰", '#ffd700');
          } else {
            setProgressoJackpot(p => p + 1);
            setFichas(f => f + aposta * 4);
            setResultado('🃏 7.5 ORIGINAL!');
            dispararReacao("7.5 ORIGINAL!", '#d4af37');
          }
        } else {
          setFichas(f => f + aposta * 3);
          setResultado('🎯 7.5 EXATO!');
          dispararReacao("PERFEITO!", '#007bff');
        }
      } else { 
        setResultado('💥 ESTOUROU!'); 
        dispararReacao("💥 BOOM!", '#ff4d4d');
      }
    }
  }

  async function ficar() {
    if (fim || aposta === null || aposta <= 0 || bancaJogando) return;
    setBancaJogando(true);
    let totalBanca = 0;
    let cartasLocal: number[] = [];

    const chanceBlefe = Math.random();
    const querBlefar = chanceBlefe < 0.35; 
    let blefouComSucesso = false;

    while (totalBanca < 7.5) {
      if (totalBanca > jogador) break;
      if (querBlefar && totalBanca >= 5 && totalBanca < jogador) {
        blefouComSucesso = true;
        break;
      }
      
      dispararReacao("PENSANDO...", "#fff"); 
      await new Promise(res => setTimeout(res, 2000));

      const carta = tirarCarta();
      totalBanca += carta;
      cartasLocal.push(carta);
      setBanca(totalBanca);
      setMaoBanca([...cartasLocal]);
      await new Promise(res => setTimeout(res, 500));
    }

    setFim(true);
    if (totalBanca > 7.5) { 
      setResultado('✅ BANCA ESTOUROU!'); 
      setFichas(f => f + aposta * 2); 
    } else if (totalBanca < jogador) {
      setResultado('✅ VITÓRIA!');
      setFichas(f => f + aposta * 2); 
    } else if (totalBanca === jogador) {
      setResultado('🏦 BANCA VENCE (EMPATE)!'); 
    } else {
      setResultado(blefouComSucesso ? '🎭 BLEFEI E GANHEI!' : '🏦 BANCA VENCEU.');
    }
    setBancaJogando(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pill}><Text style={styles.pillT}>CARTEIRA: ${fichas}</Text></View>
        <View style={[styles.pill, {borderColor: '#0f0'}]}><Text style={[styles.pillT, {color: '#0f0'}]}>APOSTA: ${aposta ?? 0}</Text></View>
      </View>

      <View style={styles.tableArea}>
        <View style={styles.dealerArea}>
          <View style={styles.dealerHead}><View style={styles.eyeRow}><View style={styles.eye}/><View style={styles.eye}/></View></View>
          <Text style={styles.bancaScore}>BANCA: {banca.toFixed(1)}</Text>
        </View>

        <View style={styles.felt}>
          {reacao && <ReacaoTexto texto={reacao.msg} cor={reacao.cor} />}
          <View style={styles.cardRow}>
            {primeiraCartaDistribuida && maoBanca.length === 0 && !fim ? <CartaMaster isOculta={true} /> : maoBanca.map((c, i) => <CartaMaster key={i} valor={c} />)}
          </View>
          {fim && <View style={styles.alertPainel}><Text style={styles.alertPainelT}>{resultado}</Text></View>}
          <View style={styles.playerSection}>
            <View style={styles.cardRow}>{maoJogador.map((c, i) => <CartaMaster key={i} valor={c} />)}</View>
            <Text style={styles.labelJogador}>VOCÊ: {jogador.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sidebar}>
        <ScrollView contentContainerStyle={{alignItems: 'center'}} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.btnLojaTab} onPress={() => setMostrarLoja(!mostrarLoja)}>
            <Text style={styles.btnLojaTabT}>{mostrarLoja ? "VOLTAR" : "🛒 LOJA"}</Text>
          </TouchableOpacity>

          {mostrarLoja ? (
            <View style={styles.lojaContainer}>
              <TouchableOpacity style={styles.btnItem} onPress={() => {setFichas(f=>f+1000); setMostrarLoja(false);}}><Text style={styles.btnItemT}>+ $1000</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnItem} onPress={() => {setFichas(f=>f+5000); setMostrarLoja(false);}}><Text style={styles.btnItemT}>+ $5000</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              {!fim ? (
                <>
                  {aposta === null && (
                    <View style={styles.sideBlock}>
                      <Text style={styles.sideTitle}>APOSTA</Text>
                      <View style={styles.chipsRow}>
                        {[10, 50, 100].map(v => <TouchableOpacity key={v} style={styles.chip} onPress={() => validarEApostar(v)}><Text style={styles.chipT}>{v}</Text></TouchableOpacity>)}
                      </View>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={valorLivre} 
                        onChangeText={handleApostaLivreChange} 
                        placeholder="$$$" 
                      />
                      <TouchableOpacity style={styles.btnSide} onPress={() => validarEApostar(Number(valorLivre))}><Text style={styles.btnSideT}>APOSTAR</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.btnSide, {backgroundColor:'#ffd700', marginTop: 8}]} onPress={allIn}><Text style={styles.btnSideT}>ALL IN</Text></TouchableOpacity>
                    </View>
                  )}
                  {aposta !== null && !primeiraCartaDistribuida && (
                    <TouchableOpacity style={[styles.circle, {backgroundColor:'#ff8c00'}]} onPress={distribuirPrimeiraCarta}><Text style={styles.circleT}>JOGAR</Text></TouchableOpacity>
                  )}
                  {primeiraCartaDistribuida && !bloqueioCompra && (
                    <View style={styles.blefeBox}>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={valorAumento} 
                        onChangeText={handleAumentoChange} 
                        placeholder="VALOR" 
                      />
                      <TouchableOpacity style={[styles.btnSide, {backgroundColor:'#ff4d4d'}]} onPress={aumentarAposta}><Text style={styles.btnSideT}>AUMENTAR</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.btnSide, {backgroundColor:'#333', marginTop: 8}]} onPress={allIn}><Text style={[styles.btnSideT, {color:'#fff'}]}>ALL IN</Text></TouchableOpacity>
                    </View>
                  )}
                  {primeiraCartaDistribuida && (
                    <View style={{gap:12, marginTop: 10}}>
                      {!bloqueioCompra && <TouchableOpacity style={[styles.circle, {backgroundColor:'#007bff'}]} onPress={comprarCartaJogador}><Text style={styles.circleT}>+ CARTA</Text></TouchableOpacity>}
                      <TouchableOpacity style={[styles.circle, {backgroundColor:'#28a745'}]} onPress={ficar}><Text style={styles.circleT}>FICAR</Text></TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity style={[styles.circle, {backgroundColor:'#d4af37'}]} onPress={()=>{setJogador(0);setMaoJogador([]);setBanca(0);setMaoBanca([]);setResultado('');setFim(false);setAposta(null);setPrimeiraCartaDistribuida(false);setBloqueioCompra(false);}}><Text style={styles.circleT}>NOVA MÃO</Text></TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
      <View style={styles.jackpotContainer}><JackpotDisplay valor={jackpot} progresso={progressoJackpot} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  header: { position: 'absolute', top: 30, width: width-180, flexDirection: 'row', justifyContent: 'center', gap: 15, zIndex: 10 },
  pill: { backgroundColor: '#111', padding: 10, borderRadius: 20, borderWidth: 2, borderColor: '#d4af37', minWidth: 120, alignItems: 'center' },
  pillT: { color: '#d4af37', fontWeight: 'bold' },
  tableArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dealerArea: { position: 'absolute', top: 120, alignItems: 'center', zIndex: 12 },
  dealerHead: { width: 50, height: 50, backgroundColor: '#1a1a1a', borderRadius: 25, borderWidth: 2, borderColor: '#d4af37', justifyContent: 'center', alignItems: 'center' },
  eyeRow: { flexDirection: 'row', gap: 8 }, eye: { width: 6, height: 6, backgroundColor: '#ffd700', borderRadius: 3 },
  bancaScore: { color: '#ffd700', fontWeight: 'bold', fontSize: 20, marginTop: 5 },
  felt: { 
    width: (width-180)*0.95, height: height*0.75, backgroundColor: '#07321a', 
    borderBottomLeftRadius: 450, borderBottomRightRadius: 450, borderTopLeftRadius: 80, borderTopRightRadius: 80,
    borderWidth: 15, borderColor: '#3d2b1f', justifyContent: 'space-around', alignItems: 'center' 
  },
  cardRow: { flexDirection: 'row', gap: 8, minHeight: 110, justifyContent: 'center' },
  playerSection: { alignItems: 'center' },
  labelJogador: { color: '#ffd700', fontWeight: 'bold', fontSize: 16, marginTop: 10 },
  sidebar: { width: 180, backgroundColor: '#0a0a0a', padding: 10, paddingTop: 40, borderLeftWidth: 2, borderColor: '#d4af37' },
  btnLojaTab: { backgroundColor: '#ffd700', width: '100%', padding: 10, borderRadius: 8, marginBottom: 15 },
  btnLojaTabT: { textAlign: 'center', color: '#000', fontWeight: 'bold' },
  lojaContainer: { width: '100%', alignItems: 'center', gap: 10 },
  btnItem: { width: '90%', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ffd700' },
  btnItemT: { color: '#ffd700', textAlign: 'center', fontWeight: 'bold' },
  sideBlock: { width: '100%', alignItems: 'center', marginBottom: 20 },
  sideTitle: { color: '#d4af37', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  chip: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#d4af37', justifyContent: 'center', alignItems: 'center' },
  chipT: { color: '#d4af37', fontWeight: 'bold' },
  input: { backgroundColor: '#fff', width: '90%', height: 40, borderRadius: 8, textAlign: 'center', fontWeight: 'bold', marginBottom: 10, color: '#000' },
  btnSide: { backgroundColor: '#d4af37', padding: 12, borderRadius: 8, width: '90%' },
  btnSideT: { textAlign: 'center', fontWeight: 'bold', color: '#000' },
  circle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  circleT: { color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 12 },
  blefeBox: { width: '100%', backgroundColor: 'rgba(255,0,0,0.1)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ff4d4d', marginVertical: 10 },
  jackpotContainer: { position: 'absolute', bottom: 30, left: 20, zIndex: 100 },
  jackpotBox: { backgroundColor: '#111', padding: 15, borderRadius: 20, borderWidth: 3, borderColor: '#ffd700', alignItems: 'center' },
  jackpotTitle: { color: '#ff4d4d', fontSize: 12, fontWeight: 'bold' },
  jackpotValue: { color: '#ffd700', fontSize: 32, fontWeight: '900', marginVertical: 5 },
  progressContainer: { flexDirection: 'row', gap: 8, marginTop: 5 },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#333' },
  progressDotActive: { backgroundColor: '#ffd700' },
  reacaoContainer: { position: 'absolute', zIndex: 999, top: '40%', alignItems: 'center', justifyContent: 'center', width: '100%' },
  reacaoTexto: { fontSize: 35, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10, textAlign: 'center' },
  card: { width: 80, height: 120, backgroundColor: '#fff', borderRadius: 8, padding: 5, justifyContent: 'space-between' },
  cardBack: { backgroundColor: '#8b0000', borderWidth: 5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  cardBackLogo: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  cardCorner: { width: '35%', height: '25%' }, cardCornerBottom: { alignSelf: 'flex-end', transform: [{ rotate: '180deg' }] },
  cardV: { fontSize: 16, fontWeight: 'bold' }, cardSuitSmall: { fontSize: 14 },
  centerWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' }, cardCenter: { fontSize: 35 },
  alertPainel: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.95)', padding: 20, borderRadius: 20, borderWidth: 3, borderColor: '#d4af37', zIndex: 100 },
  alertPainelT: { color: '#ffd700', fontWeight: 'bold', fontSize: 20 }
});