import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context';
import HomeHeader from '../components/cine/HomeHeader';
import StoriesBar from '../components/cine/StoriesBar';
import CineDrivePost from '../components/cine/CineDrivePost';
import type { CineDrivePost as CineDrivePostData } from '../context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT    = 56;
const STORIES_BAR_HEIGHT = 92;
const TAB_BAR_HEIGHT   = 60;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { cinePosts, toggleLikeCinePost, toggleSaveCinePost } = useAppContext();

  const postHeight =
    SCREEN_HEIGHT - HEADER_HEIGHT - STORIES_BAR_HEIGHT - TAB_BAR_HEIGHT - insets.bottom;

  const handleAddPress = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  const handleUserPress = useCallback((userId: string, username: string) => {
    navigation.navigate('UserProfile', { userId, username });
  }, [navigation]);

  const renderPost = useCallback(
    ({ item, index }: ListRenderItemInfo<CineDrivePostData>) => (
      <CineDrivePost
        post={item}
        index={index}
        postHeight={postHeight}
        onLike={toggleLikeCinePost}
        onSave={toggleSaveCinePost}
        onUserPress={handleUserPress}
      />
    ),
    [postHeight, toggleLikeCinePost, toggleSaveCinePost, handleUserPress]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#140102" />

      <HomeHeader onAddPress={handleAddPress} />
      <StoriesBar />

      <FlatList
        data={cinePosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={postHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(_, index) => ({
          length: postHeight,
          offset: postHeight * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#140102',
  },
});
